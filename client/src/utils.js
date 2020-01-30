/**
 * Shuffle array IN PLACE
 *
 * https://www.frankmitchell.org/2015/01/fisher-yates/
 *
 * @param {Array} items
 */
export function shuffle(items) {
  let j;
  let temp;

  for (let i = items.length - 1; i > 0; i -= 1) {
    j = Math.floor(Math.random() * (i + 1))
    temp = items[i]
    items[i] = items[j]
    items[j] = temp
  }
}