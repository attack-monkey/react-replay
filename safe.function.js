export const safe = (state, keyChainArray) => {
  try {
    return keyChainArray.reduce((ac, key) => ac[key], state)
  } catch (e) {
    return undefined
  }
}
