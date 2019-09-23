require('array-foreach-async')

const axios = require('axios')
const fs = require('fs')
const meta = require('./meta')
const targets = [
  {type: 'pref', data: meta.pref},
  {type: 'city', data: meta.city}
]

targets.forEach(async target => {
  const type = target.type
  const data = target.data

  await data.forEachAsync(async datum => {
    const promises = datum.children.map(async child => {
      const response = await axios({
        method: 'get',
        url: 'https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo',
        params: {
          appId: '63bd852098e1a13aeea70ed78cba31f9f3918d2f',
          statsDataId: child.statId
        }
      })
      const classObjs = response.data['GET_META_INFO']['METADATA_INF']['CLASS_INF']['CLASS_OBJ']
      const cat01s = classObjs.find(val => val['@id'] === 'cat01').CLASS
      return {key: child.key, statId: child.statId, cat01s: cat01s}
    })

    const results = await Promise.all(promises)
    datum.children.forEach((child, index) => {
      const cat01s = (results[index].cat01s instanceof Array) ? results[index].cat01s : [results[index].cat01s]
      child.children = cat01s.map(cat01 => ({
        key: child.key + '/' + cat01['@code'],
        statId: child.statId,
        cat01: cat01['@code'],
        label: cat01['@name'].split('_')[1],
        unit: cat01['@unit']
      }))
    })
  })

  fs.writeFileSync('result/meta-' + type + '.json', JSON.stringify(data, null, '    '))
})
