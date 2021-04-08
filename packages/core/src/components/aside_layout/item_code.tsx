/* eslint-disable no-unused-vars */
import { Drawer, Spinner } from 'amis'
import { Editor, toast } from 'amis/lib/components'
import { RendererProps } from 'amis/lib/factory'
import { cloneDeep, isObject, isFunction, map } from 'lodash'
import React, { useState, useRef, useEffect } from 'react'

import { app } from '@/app'
import { storage } from '@/constants'
import { getRouteConfig } from '@/routes/config'
import { getAppLimits } from '@/routes/limit/exports'
import { getGlobal, setGlobal } from '@/utils/store'
import { ObjectOf } from '@/utils/types'

type CodeType = 'init' | 'route' | 'page' | 'limit'

export default (props: RendererProps) => {
  const { render, theme } = props

  const [show, toggle] = useState(false)
  const [loading, toggleLoading] = useState(true)

  const storeRef = useRef<ObjectOf<any>>({})

  useEffect(() => {
    setGlobal(storage.dev.code, { enable: true })
  }, [])

  const toggleDrawer = () => toggle((t) => !t)

  const onEditorMounted = () => {
    if (loading) {
      toggleLoading(false)
    }
  }

  const getCodeString = (type: string) => {
    let json: any = {}
    switch (type) {
      case 'page': {
        json = getGlobal(storage.dev.code) || {}
        if (!json.schema) {
          return false
        }
        // reorder jsonSchema output
        const { definitions, preset, ...reset } = json.schema
        json.schema = { ...reset, definitions, preset }
        transSchema(cloneDeep(json.schema))
        break
      }
      case 'route':
        json = getRouteConfig(true)
        transSchema(json)
        break
      case 'limit':
        json = getAppLimits()
        break
      default:
        return false
    }
    const jsonStr = JSON.stringify(json.schema || json)
    return jsonStr
  }

  const viewCode = (codeType: CodeType) => {
    const codeString = getCodeString(codeType)
    storeRef.current.codeString = codeString

    if (codeType === 'page' && !codeString) {
      toast.info('当前页面无数据', '系统提示')
      return
    }
    toggleDrawer()
  }

  const dropDownSchema = {
    type: 'lib-dropdown',
    className: 'l-h-1',
    body: {
      type: 'button',
      iconOnly: true,
      icon: 'fa fa-code',
      level: 'blank',
      // className: 'h-full',
    },
    items: [
      {
        type: 'button',
        level: 'link',
        icon: 'fa fa-file-code-o',
        label: '本页面JSON',
        onClick: () => viewCode('page'),
      },
      {
        type: 'button',
        level: 'link',
        icon: 'fa fa-code-fork',
        label: 'APP路由配置',
        onClick: () => viewCode('route'),
      },
      {
        type: 'button',
        level: 'link',
        icon: 'fa fa-unlock',
        label: '当前拥有权限',
        onClick: () => viewCode('limit'),
      },
    ],
  }

  if (app.env.isRelease) {
    return null
  }

  return (
    <>
      <Drawer
        closeOnOutside
        theme={theme}
        size="lg"
        onHide={toggleDrawer}
        show={show}
        position="left"
      >
        <Spinner overlay show={show && loading} size="lg" />
        {show && (
          <Editor
            editorDidMount={onEditorMounted}
            options={{ readOnly: true }}
            editorTheme={theme === 'dark' ? 'vs-dark' : 'vs'}
            language="json"
            value={storeRef.current.codeString}
          />
        )}
      </Drawer>
      {render('body', dropDownSchema)}
    </>
  )
}

function transSchema(schema: any) {
  if (!isObject(schema)) {
    return
  }
  map(schema, (val, key) => {
    if (isFunction(val)) {
      ;(schema as any)[key] = 'Function Body'
    } else if (isObject(val)) {
      transSchema(val)
    }
  })
}
