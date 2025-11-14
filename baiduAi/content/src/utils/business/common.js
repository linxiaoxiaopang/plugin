/* eslint-disable */

export function combineArrays(...arrays) {
  if (arrays.length === 0) {
    return [[]]
  }
  
  const [currentArray, ...restArrays] = arrays
  const combinations = combineArrays(...restArrays)
  
  const result = []
  currentArray.forEach(item => {
    combinations.forEach(combination => {
      result.push([item, ...combination])
    })
  })
  
  return result
}