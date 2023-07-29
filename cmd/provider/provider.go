package provider

import (
	"cargomail/cmd/provider/api"
	"cargomail/cmd/provider/app"
	"cargomail/internal/repository"
	"context"
	"database/sql"
	"embed"
	"html/template"
	"log"
	"net/http"
	"strings"
	"time"

	"golang.org/x/sync/errgroup"
)

type ServiceParams struct {
	DomainName   string
	FilesPath    string
	DB           *sql.DB
	ProviderBind string
	Stage        string
}

type service struct {
	app          app.App
	api          api.Api
	providerBind string
	stage        string
}

func NewService(params *ServiceParams) (service, error) {
	repository := repository.NewRepository(params.DB)

	templates, err := LoadTemplates()
	if err != nil {
		return service{}, err
	}

	return service{
		app: app.NewApp(
			app.AppParams{
				DomainName:       params.DomainName,
				Repository:       repository,
				HomeTemplate:     templates[homePage],
				LoginTemplate:    templates[loginPage],
				RegisterTemplate: templates[registerPage],
			}),
		api: api.NewApi(
			api.ApiParams{
				DomainName: params.DomainName,
				Repository: repository,
				FilesPath:  params.FilesPath,
			}),
		providerBind: params.ProviderBind,
		stage:        params.Stage,
	}, err
}

const (
	publicDir    = "public"
	templatesDir = "templates/"
	layoutsDir   = "templates/layouts/"
	baseLayout   = "base.layout.html"
	menuLayout   = "menu.layout.html"

	contactsPage = "contacts.page.html"
	profilePage  = "profile.page.html"
	composePage  = "compose.page.html"
	cargoesPage  = "cargoes.page.html"
	filesPage    = "files.page.html"
	loginPage    = "login.page.html"
	registerPage = "register.page.html"

	homePage = "home.page"
)

var (
	//go:embed public/* templates/* templates/layouts/*
	files embed.FS
	// templates map[string]*template.Template
)

func LoadTemplates() (map[string]*template.Template, error) {
	templates := make(map[string]*template.Template)
	var err error

	templates[registerPage], err = template.ParseFS(files, templatesDir+registerPage, layoutsDir+baseLayout)
	if err != nil {
		return nil, err
	}

	templates[loginPage], err = template.ParseFS(files, templatesDir+loginPage, layoutsDir+baseLayout)
	if err != nil {
		return nil, err
	}

	templates[homePage], err = template.ParseFS(files,
		templatesDir+contactsPage,
		templatesDir+profilePage,
		templatesDir+composePage,
		templatesDir+cargoesPage,
		templatesDir+filesPage,
		layoutsDir+menuLayout,
		layoutsDir+baseLayout)
	if err != nil {
		return nil, err
	}

	return templates, nil
}

func (svc *service) Serve(ctx context.Context, errs *errgroup.Group) {
	router := NewRouter()

	svc.routes(router)

	var fs http.Handler

	if strings.EqualFold(svc.stage, "dev") {
		fs = http.FileServer(http.Dir("cmd/provider"))
	} else {
		fs = http.FileServer(http.FS(files))
	}

	router.Route("GET", "/"+publicDir+"/", http.StripPrefix("/", fs))

	http1Server := &http.Server{Handler: router, Addr: svc.providerBind}
	// http2.ConfigureServer(http1Server, &http2.Server{})

	errs.Go(func() error {
		<-ctx.Done()
		gracefulStop, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()

		err := http1Server.Shutdown(gracefulStop)
		if err != nil {
			return err
		}
		log.Print("provider service shutdown gracefully")
		return nil
	})

	errs.Go(func() error {
		log.Printf("provider service is listening on http://%s", http1Server.Addr)
		return http1Server.ListenAndServe()
	})
}
