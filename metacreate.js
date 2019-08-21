const axios = require('axios')
const fs = require('fs');
const metapref = require('./meta');
const targets = [
  {type: 'pref', data:metapref.pref},
  {type: 'city', data:metapref.city}
  ];
let count = 0;
targets.forEach((value, index) => {
  const target = value.data;
  let plomises = []
  plomises[index] = [];
  target.forEach(value => {
    const children = value.children
    children.forEach(value => {
      const key = value.key;
      const statId = value.statId;
      plomises[index][count] = new Promise(function(resolve) {
        axios({
          method: 'get',
          url: 'https://api.e-stat.go.jp/rest/2.1/app/json/getMetaInfo',
          params: {
            statsDataId: statId,
            appId: '63bd852098e1a13aeea70ed78cba31f9f3918d2f'
          }
        })
        .then(response => {
          const classObjs = response.data['GET_META_INFO']['METADATA_INF']['CLASS_INF']['CLASS_OBJ'];
          const cat01s = classObjs.find(val => val['@id'] === 'cat01').CLASS;
          resolve({key: key, statId: statId, cat01s: cat01s})
        });
      });
      count++;
    })
  })
  Promise.all(plomises[index]).then(function (result) {
    result.forEach(value => {
      if(value) {
        const childrenArr = [];
        const key = value.key;
        const statId = value.statId;
        let sourceId = '';
        if (value.cat01s.length) {
          for (const j in value.cat01s) {
            const tgt = value.cat01s[j];
            childrenArr.push({
              key: key + '/' + tgt['@code'] ,
              statId: statId,
              cat01: tgt['@code'],
              label: tgt['@name'].split('_')[1],
              unit: tgt['@unit'],
            });
          }
        } else {
          const tgt = value.cat01s;
          childrenArr.push({
            key: key + '/' + tgt['@code'] ,
            statId: statId,
            cat01: tgt['@code'],
            label: tgt['@name'].split('_')[1],
            unit: tgt['@unit'],
          });
        }
        // -------------------------------------------------------------------------------------
        target.forEach(value0 => {
          value0.children.find((value, index, array) => {
            if (value.statId === statId) {
              array[index].children = childrenArr
            }
          });
        })
      }
    })
    const type = value.type;
    fs.writeFile('result/meta-' + type + '.json', JSON.stringify(target, null, '    '), function(err) {})
  })
});
