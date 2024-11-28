/**
 * Dot density binning for dot plot construction.
 * Based on Leland Wilkinson, Dot Plots, The American Statistician, 1999.
 * https://www.cs.uic.edu/~wilkinson/Publications/dotplots.pdf
 * @param {number[]} x The values to bin, in ascending sort order.
 * @param {number} step The step size between bins, in units of the data domain.
 * @param {boolean} [smooth=false] Flag indicating if smoothing should be performed.
 * @return A new array of dot bin locations.
 */
export function dotbin(x, step, smooth = false) {
  x = x.slice(); // make a protective copy
  const n = x.length;

  let left = 0; // left index of the current bin

  // scan from left, group points less than one step away
  for (let j = 1; j < n; ++j) {
    if (x[j] >= x[left] + step) {
      // use span mid-point, unless that could cause overlap
      const xmid = Math.min((x[left] + x[j - 1]) / 2, x[j] - step);
      x.fill(xmid, left, j);
      left = j;
    }
  }
  x.fill((x[left] + x[n - 1]) / 2, left, n);

  // if requested, smooth to reduce variance and balance "adjacent" bins
  // Wilkinson defines adjacent as within step / 4 units
  if (smooth) {
    const thresh = step + step / 4;
    let a = 0,
      b = 1;
    while (x[a] === x[b]) ++b; // get left bin

    while (b < n) {
      let c = b + 1;
      while (x[b] === x[c]) ++c; // get right bin

      // are bins adjacent? if so, balance them
      if (x[b] - x[a] < thresh) {
        const mid = (a + c) >> 1;
        x.fill(x[b], mid, b);
        x.fill(x[a], b, mid);
      }
      (a = b), (b = c); // update left bin indices
    }
  }

  return x;
}
