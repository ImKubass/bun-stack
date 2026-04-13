export const sameHeight = (
  group: Element,
  elements: string | NodeListOf<HTMLElement> | HTMLElement[],
  byRow = false,
  parentRowSelector: string = "",
) => {
  const targets =
    elements instanceof NodeList
      ? Array.from(elements)
      : typeof elements === "string"
        ? Array.from(group.querySelectorAll<HTMLElement>(elements))
        : elements

  const getHighestElement = (elements = targets) => {
    const heights = elements.map((box) => box.offsetHeight)
    return Math.max(...heights)
  }

  const resetHeight = (elements = targets) => {
    elements.forEach((element) => element.style.setProperty("height", null))
  }

  const updateHeight = (elements = targets) => {
    const theHighest = `${getHighestElement(elements)}px`
    elements.forEach((element) =>
      element.style.setProperty("height", theHighest),
    )
  }

  const updateByRow = () => {
    const rowTargets = parentRowSelector
      ? Array.from(group.querySelectorAll<HTMLElement>(parentRowSelector))
      : targets

    const rows = Array.from(
      new Set(rowTargets.map((rowTarget) => rowTarget.offsetTop)),
    )
    const elementsCollection: HTMLElement[][] = []
    let targetsToFilter = targets

    rows.forEach((row) => {
      const elementsInSameRow = parentRowSelector
        ? targets.filter(
            (target) =>
              target.closest<HTMLElement>(parentRowSelector)?.offsetTop === row,
          )
        : targets.filter((target) => target.offsetTop === row)
      elementsCollection.push(elementsInSameRow)
      targetsToFilter = targetsToFilter.filter(
        (item) => !elementsInSameRow.includes(item),
      )
    })

    elementsCollection.forEach((elements) => updateHeight(elements))
  }

  const resizeObserver = new ResizeObserver(() => {
    resetHeight()
    byRow ? updateByRow() : updateHeight()
  })

  resizeObserver.observe(group)
}

const init = () => {
  const groups = document.querySelectorAll(`[data-same-height]`)

  groups.forEach((group) => {
    const byRow = group.hasAttribute("data-same-height-by-row")

    const targets = Array.from(
      group.querySelectorAll<HTMLElement>(`[data-same-height-target]`),
    )
    const collections = Array.from(
      new Set(
        targets.map((target) => target.getAttribute("data-same-height-target")),
      ),
    )

    collections.forEach((collection) => {
      const collectionElements = group.querySelectorAll<HTMLElement>(
        `[data-same-height-target="${collection}"]`,
      )
      sameHeight(group, collectionElements, byRow)
    })
  })
}

// call after rerender -> document.dispatchEvent(new Event("sameHeight")) -> reinitialize
document.addEventListener("sameHeight", () => init())
init()
