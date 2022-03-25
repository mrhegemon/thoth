import { useEffect, useRef } from 'react'
import { ChainData } from '@latitudegames/thoth-core/dist/types'

import {
  uniqueNamesGenerator,
  adjectives,
  colors,
} from 'unique-names-generator'

import {
  useSaveSpellMutation,
  useGetSpellQuery,
  Spell,
} from '../../../state/api/spells'
import { useEditor } from '../../../workspaces/contexts/EditorProvider'
import { useLayout } from '../../../workspaces/contexts/LayoutProvider'

// Config for unique name generator
const customConfig = {
  dictionaries: [adjectives, colors],
  separator: ' ',
  length: 2,
}

const EventHandler = ({ pubSub, tab }) => {
  // only using this to handle events, so not rendering anything with it.
  const { createOrFocus, windowTypes } = useLayout()

  const [saveSpellMutation] = useSaveSpellMutation()
  const { data: spell } = useGetSpellQuery(tab.spellId, {
    skip: !tab.spellId,
  })

  // Spell ref because callbacks cant hold values from state without them
  const spellRef = useRef<Spell | null>(null)
  useEffect(() => {
    if (!spell) return
    spellRef.current = spell
  }, [spell])

  const { serialize, getEditor, undo, redo } = useEditor()

  const { events, subscribe } = pubSub

  const {
    $UNDO,
    $REDO,
    $SAVE_SPELL,
    $CREATE_STATE_MANAGER,
    $CREATE_PLAYTEST,
    $CREATE_INSPECTOR,
    $CREATE_TEXT_EDITOR,
    $SERIALIZE,
    $EXPORT,
    $CLOSE_EDITOR,
  } = events

  const saveSpell = async () => {
    const currentSpell = spellRef.current
    const chain = serialize() as ChainData

    await saveSpellMutation({ ...currentSpell, chain })
  }

  const createStateManager = () => {
    createOrFocus(windowTypes.STATE_MANAGER, 'State Manager')
  }

  const createPlaytest = () => {
    createOrFocus(windowTypes.PLAYTEST, 'Playtest')
  }

  const createInspector = () => {
    createOrFocus(windowTypes.INSPECTOR, 'Inspector')
  }

  const createTextEditor = () => {
    createOrFocus(windowTypes.TEXT_EDITOR, 'Text Editor')
  }

  const onSerialize = () => {
    // eslint-disable-next-line no-console
    console.log(serialize())
  }

  const onUndo = () => {
    undo()
  }

  const onRedo = () => {
    redo()
  }

  const onExport = async () => {
    // refetch spell from local DB to ensure it is the most up to date
    const spell = { ...spellRef.current }
    spell.chain = serialize() as ChainData
    spell.name = uniqueNamesGenerator(customConfig)

    const json = JSON.stringify(spell)

    const blob = new Blob([json], { type: 'application/json' })
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${spell.name}.thoth`)

    // Append to html link element page
    document.body.appendChild(link)

    // Start download
    link.click()

    if (!link.parentNode) return

    // Clean up and remove the link
    link.parentNode.removeChild(link)
  }

  // clean up anything inside the editor which we need to shut down.
  // mainly subscriptions, etc.
  const onCloseEditor = () => {
    const editor = getEditor() as Record<string, any>
    if (editor.moduleSubscription) editor.moduleSubscription.unsubscribe()
  }

  const handlerMap = {
    [$SAVE_SPELL(tab.id)]: saveSpell,
    [$CREATE_STATE_MANAGER(tab.id)]: createStateManager,
    [$CREATE_PLAYTEST(tab.id)]: createPlaytest,
    [$CREATE_INSPECTOR(tab.id)]: createInspector,
    [$CREATE_TEXT_EDITOR(tab.id)]: createTextEditor,
    [$SERIALIZE(tab.id)]: onSerialize,
    [$EXPORT(tab.id)]: onExport,
    [$CLOSE_EDITOR(tab.id)]: onCloseEditor,
    [$UNDO(tab.id)]: onUndo,
    [$REDO(tab.id)]: onRedo,
  }

  useEffect(() => {
    if (!tab && !spell) return

    const subscriptions = Object.entries(handlerMap).map(([event, handler]) => {
      return subscribe(event, handler)
    })

    // unsubscribe from all subscriptions on unmount
    return () => {
      subscriptions.forEach(unsubscribe => {
        unsubscribe()
      })
    }
  }, [tab])

  return null
}

export default EventHandler