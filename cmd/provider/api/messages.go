package api

import (
	"cargomail/cmd/provider/api/helper"
	"cargomail/internal/repository"
	"encoding/json"
	"net/http"
)

type MessagesApi struct {
	messages repository.MessageRepository
}

func (api *MessagesApi) List() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var folder repository.Folder

		err := helper.Decoder(r.Body).Decode(&folder)
		if err != nil {
			if err.Error() != "EOF" {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
		}

		messageHistory, err := api.messages.List(user, folder.Folder)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, messageHistory)
	})
}

func (api *MessagesApi) Sync() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var history *repository.History

		err := helper.Decoder(r.Body).Decode(&history)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		messageHistory, err := api.messages.Sync(user, history)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, messageHistory)
	})
}

func (api *MessagesApi) Update() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var state repository.State

		err := helper.Decoder(r.Body).Decode(&state)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if state.Uris == nil {
			http.Error(w, repository.ErrMissingUrisField.Error(), http.StatusBadRequest)
			return
		}

		// back to body
		_, err = json.Marshal(state.Uris)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		err = api.messages.Update(user, &state)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *MessagesApi) Trash() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var uris repository.Uris

		err := helper.Decoder(r.Body).Decode(&uris)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if uris.Uris == nil {
			http.Error(w, repository.ErrMissingUrisField.Error(), http.StatusBadRequest)
			return
		}

		// back to body
		body, err := json.Marshal(uris)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		urisString := string(body)

		err = api.messages.Trash(user, urisString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *MessagesApi) Untrash() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var uris repository.Uris

		err := helper.Decoder(r.Body).Decode(&uris)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if uris.Uris == nil {
			http.Error(w, repository.ErrMissingUrisField.Error(), http.StatusBadRequest)
			return
		}

		// back to body
		body, err := json.Marshal(uris)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		urisString := string(body)

		err = api.messages.Untrash(user, urisString)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}

func (api *MessagesApi) Delete() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(repository.UserContextKey).(*repository.User)
		if !ok {
			helper.ReturnErr(w, repository.ErrMissingUserContext, http.StatusInternalServerError)
			return
		}

		var uris repository.Uris

		err := helper.Decoder(r.Body).Decode(&uris)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if uris.Uris == nil {
			http.Error(w, repository.ErrMissingUrisField.Error(), http.StatusBadRequest)
			return
		}

		// back to body
		body, err := json.Marshal(uris)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		urisString := string(body)

		err = api.messages.Delete(user, urisString)
		if err != nil {
			helper.ReturnErr(w, err, http.StatusInternalServerError)
			return
		}

		helper.SetJsonResponse(w, http.StatusOK, map[string]string{"status": "OK"})
	})
}
