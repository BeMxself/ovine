import { uuid } from 'amis/lib/utils/helper'

import { MockListStore } from '@core/utils/mock'

const generator = (i) => ({
  id: i,
  name: uuid(),
  desc:
    '描述文案一大堆，描述文案一大堆描述文案一大堆描述文案一大堆描述文案一大堆描述文案一大堆描述文案一大堆',
  updateTime: Date.now(),
  createTime: Date.now(),
})

const defaultItem = generator(0)

const mockStore = new MockListStore({ generator })

const mockSource = {
  'GET rtapi/system/role/item': () => {
    const items = mockStore.search()
    return {
      data: {
        items,
        total: items.length,
      },
    }
  },
  'POST rtapi/system/role/item/$id': ({ data = defaultItem }) => {
    return mockStore.updateById(data, {
      updater: {
        createTime: Date.now(),
      },
    })
  },
  'PUT rtapi/system/role/item/$id': ({ data = defaultItem }) => {
    return mockStore.add(data, {
      updater: {
        updateTime: Date.now(),
      },
    })
  },
  'DELETE rtapi/system/role/item/$id': ({ data = defaultItem }) => {
    return mockStore.deleteById(data, {})
  },
  'GET rtapi/system/role/item/$id/limit': ({ data = defaultItem }) => {
    return mockStore.deleteById(data, {})
  },
  'PUT rtapi/system/role/item/$id/limit': ({ data = defaultItem }) => {
    return mockStore.deleteById(data, {})
  },
  'GET rtapi/system/user/item': ({ data = defaultItem }) => {
    return mockStore.deleteById(data, {})
  },
  'PUT rtapi/system/role/member': ({ data = defaultItem }) => {
    return mockStore.deleteById(data, {})
  },
}

export default mockSource
