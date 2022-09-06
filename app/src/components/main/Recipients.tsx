import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import parse from 'autosuggest-highlight/parse'
import match from 'autosuggest-highlight/match'
import Button from '@mui/material/Button'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import { FC, FormEvent, Fragment, ReactNode, useContext, useEffect, useState } from 'react'
import { ContactsContext, IContact } from '../../context/ContactsContext'
import usePeopleAPI from '../../api/PeopleAPI'
import { IDraftEdit } from '../../context/DraftsContext'
import useFedemailAPI from '../../api/FedemailAPI'

const filter = createFilterOptions({
  matchFrom: 'start',
  stringify: (option: IContact) => option.emailAddress,
})

export type RecipientsSelectProps = {
  children?: ReactNode
  sx: Object
  initialValue?: any
  draftEdit: IDraftEdit
}

export const RecipientsSelect: FC<RecipientsSelectProps> = (props) => {
  const [open, setOpen] = useState(false) // if dropdown open?

  const [value, setValue] = useState<IContact[]>([])
  const [openDialog, openDialogOpen] = useState(false)

  const { draftsUpdate } = useFedemailAPI()

  const { contactsList } = usePeopleAPI()
  const { contacts, setContacts } = useContext(ContactsContext)

  const loading = open && contacts.length === 0 // is it still loading

  useEffect(() => {
    let active = true

    if (!loading) {
      return undefined
    }

    if (active) {
      contactsList()
    }

    return () => {
      active = false
    }
  }, [contacts, contactsList, loading])

  const [dialogValue, setDialogValue] = useState<IContact>({
    id: '',
    givenName: '',
    familyName: '',
    emailAddress: '',
  })

  const handleClose = () => {
    setDialogValue({
      id: '',
      givenName: '',
      familyName: '',
      emailAddress: '',
    })

    openDialogOpen(false)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setValue([
      ...value,
      {
        id: dialogValue.id,
        givenName: dialogValue.givenName,
        familyName: dialogValue.familyName,
        emailAddress: dialogValue.emailAddress,
      },
    ])

    draftsUpdate({
      ...props.draftEdit,
      recipients: buildDraftRecipients([
        ...value,
        {
          id: dialogValue.id,
          givenName: dialogValue.givenName,
          familyName: dialogValue.familyName,
          emailAddress: dialogValue.emailAddress,
        },
      ]),
    })

    setContacts({
      id: dialogValue.id,
      givenName: dialogValue.givenName,
      familyName: dialogValue.familyName,
      emailAddress: dialogValue.emailAddress,
    })

    handleClose()
  }

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault()
    console.log(value)
  }

  const buildDraftRecipients = (contacts: IContact[]): string => {
    const recipients = contacts
      .map((contact) => {
        const name = `${contact.givenName} ${contact.familyName}`
        return `${name.trim().length > 0 ? `"${name}"` : ''} <${contact.emailAddress}>`.trimStart()
      })
      .join()
    console.log(recipients)
    return recipients
  }

  const validateEmailAddress = (value: string) => {
    const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+$/i
    return !regex.test(value.replace(/\s/g, ''))
  }

  return (
    <Fragment>
      <form onSubmit={handleFormSubmit}>
        <Autocomplete
          sx={props.sx}
          disablePortal
          open={open}
          onOpen={() => {
            setOpen(true)
          }}
          onClose={() => {
            setOpen(false)
          }}
          loading={loading}
          multiple
          value={value}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          onChange={(event, newValue) => {
            if (typeof newValue === 'string') {
              // timeout to avoid instant validation of the dialog's form.
              setTimeout(() => {
                openDialogOpen(true)
                setDialogValue({
                  id: crypto.randomUUID(),
                  givenName: '',
                  familyName: '',
                  emailAddress: newValue,
                })
              })
            } else if (newValue.slice(-1)[0] && newValue.slice(-1)[0].inputValue) {
              openDialogOpen(true)
              const newContact = (newValue.slice(-1)[0].inputValue || '').split(/\s+/)
              setDialogValue({
                id: crypto.randomUUID(),
                givenName: newContact[1] || '', // newGivenName
                familyName: newContact[2] || '', // newFamilyName
                emailAddress: newContact[0] || '', // newEmailAddress
              })
            } else {
              console.log(newValue)
              setValue(newValue as any)
              draftsUpdate({
                ...props.draftEdit,
                recipients: buildDraftRecipients(newValue),
              })
            }
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params)
            const isExisting = options.some((option) => params.inputValue.split(' ')[0] === option.emailAddress)
            if (params.inputValue.split(' ')[0] !== '' && !isExisting) {
              filtered.push({
                inputValue: params.inputValue,
                id: crypto.randomUUID(),
                givenName: '',
                familyName: '',
                emailAddress: `Add "${params.inputValue}" to Contacts`,
              })
            }

            return filtered
          }}
          id="recipients-select"
          options={contacts}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option
            }
            if (option.inputValue) {
              return option.inputValue
            }
            return option.emailAddress
          }}
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          renderOption={(props, option, { inputValue }) => {
            const matches = match(option.emailAddress, inputValue.split(' ')[0])
            const parts = parse(option.emailAddress, matches)

            return (
              <li {...props}>
                <div>
                  {parts.map((part, index) => (
                    <span
                      key={index}
                      style={{
                        color: part.highlight ? 'green' : 'inherit',
                        fontWeight: part.highlight ? 700 : 400,
                      }}>
                      {part.text}
                    </span>
                  ))}
                </div>
              </li>
            )
          }}
          renderInput={(params) => (
            <TextField
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                },
              }}
              {...params}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <Fragment>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </Fragment>
                ),
              }}
              label="Recipients"
            />
          )}
        />
      </form>
      <Dialog sx={{ zIndex: 9999 }} open={openDialog} onClose={handleClose}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add a new contact</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              id="emailAddress"
              value={dialogValue?.emailAddress}
              onChange={(event) =>
                setDialogValue({
                  ...dialogValue,
                  emailAddress: event.target.value,
                })
              }
              required
              label="Email address"
              type="email"
              autoComplete="email"
              variant="standard"
              error={validateEmailAddress(dialogValue?.emailAddress)}
            />
            <br />
            <TextField
              autoFocus
              margin="dense"
              id="givenName"
              value={dialogValue?.givenName}
              onChange={(event) =>
                setDialogValue({
                  ...dialogValue,
                  givenName: event.target.value,
                })
              }
              label="Given name"
              type="text"
              variant="standard"
            />
            <TextField
              margin="dense"
              id="familyName"
              value={dialogValue?.familyName}
              onChange={(event) =>
                setDialogValue({
                  ...dialogValue,
                  familyName: event.target.value,
                })
              }
              label="Family name"
              type="text"
              variant="standard"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit">Add</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Fragment>
  )
}
