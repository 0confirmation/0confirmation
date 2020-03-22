/* eslint no-undef: 0 */

const json = methods

web3.currentProvider.enable().then(() => {

  Object.keys(json).forEach((methodGroupKey) => {

    console.log(methodGroupKey)
    const methodGroup = json[methodGroupKey]
    console.log(methodGroup)
    Object.keys(methodGroup).forEach((methodKey) => {

      const methodButton = document.getElementById(methodKey)
      methodButton.addEventListener('click', () => {

        window.ethereum.sendAsync({
          method: methodKey,
          params: methodGroup[methodKey][1],
        }, (err, result) => {
          if (err) {
            console.log(err)
            console.log(methodKey)
          } else {
            document.getElementById('results').innerHTML = JSON.stringify(result)
          }
        })
      })

    })

  })
})

