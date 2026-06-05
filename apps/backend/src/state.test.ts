import { describe, it, expect, beforeEach } from 'vitest'
import { applyReorder, applySelect, applyUnselect, applyCreate, getUnselectedPage, getSelectedPage, selected, order, items, resetStateForTesting } from './state'

// Reset shared mutable state before every test
beforeEach(() => {
  selected.clear()
  order.length = 0
  resetStateForTesting()
})

// Populate selected + order in one call
function setup(ids: number[]) {
  for (const id of ids) {
    selected.add(id)
    order.push(id)
  }
}

// ─────────────────────────────────────────
// applyReorder
// ─────────────────────────────────────────

describe('applyReorder', () => {
  describe('valid moves', () => {
    it('moves item to the beginning (afterId = null)', () => {
      setup([1, 2, 3, 4])
      expect(applyReorder(4, null)).toBe(true)
      expect(order).toEqual([4, 1, 2, 3])
    })

    it('moves item to the end', () => {
      setup([1, 2, 3, 4])
      expect(applyReorder(1, 4)).toBe(true)
      expect(order).toEqual([2, 3, 4, 1])
    })

    it('moves item forward (toward beginning)', () => {
      setup([1, 2, 3, 4])
      expect(applyReorder(3, 1)).toBe(true)
      expect(order).toEqual([1, 3, 2, 4])
    })

    it('moves item backward (toward end)', () => {
      setup([1, 2, 3, 4])
      expect(applyReorder(2, 3)).toBe(true)
      expect(order).toEqual([1, 3, 2, 4])
    })

    it('preserves relative order of untouched items', () => {
      setup([1, 2, 3, 4, 5])
      expect(applyReorder(5, 1)).toBe(true)
      expect(order).toEqual([1, 5, 2, 3, 4])
    })

    it('no-op move: item placed after its current predecessor', () => {
      setup([1, 2, 3])
      expect(applyReorder(2, 1)).toBe(true)
      expect(order).toEqual([1, 2, 3])
    })

    it('works with a single item (move to beginning is a no-op)', () => {
      setup([42])
      expect(applyReorder(42, null)).toBe(true)
      expect(order).toEqual([42])
    })
  })

  describe('invalid operations — returns false and leaves order unchanged', () => {
    it('id not in selection', () => {
      setup([1, 2, 3])
      expect(applyReorder(99, null)).toBe(false)
      expect(order).toEqual([1, 2, 3])
    })

    it('afterId not in selection', () => {
      setup([1, 2, 3])
      expect(applyReorder(1, 99)).toBe(false)
      expect(order).toEqual([1, 2, 3])
    })

    it('id === afterId', () => {
      setup([1, 2, 3])
      expect(applyReorder(2, 2)).toBe(false)
      expect(order).toEqual([1, 2, 3])
    })
  })
})

// ─────────────────────────────────────────
// applySelect / applyUnselect
// ─────────────────────────────────────────

describe('applySelect', () => {
  it('adds item to selected and order', () => {
    applySelect([1, 2, 3])
    expect([...selected]).toEqual([1, 2, 3])
    expect(order).toEqual([1, 2, 3])
  })

  it('ignores items not in the items Set', () => {
    applySelect([999_999_999])
    expect(selected.size).toBe(0)
  })

  it('is idempotent — duplicate select is a no-op', () => {
    applySelect([1])
    applySelect([1])
    expect(order).toEqual([1])
    expect(selected.size).toBe(1)
  })

  it('appends in call order', () => {
    applySelect([3, 1, 2])
    expect(order).toEqual([3, 1, 2])
  })
})

describe('applyUnselect', () => {
  it('removes item from selected and order', () => {
    setup([1, 2, 3])
    applyUnselect([2])
    expect([...selected]).toEqual([1, 3])
    expect(order).toEqual([1, 3])
  })

  it('is idempotent — unselecting a non-selected item is a no-op', () => {
    setup([1, 2])
    applyUnselect([99])
    expect(order).toEqual([1, 2])
  })

  it('preserves order of remaining items', () => {
    setup([1, 2, 3, 4, 5])
    applyUnselect([2, 4])
    expect(order).toEqual([1, 3, 5])
  })
})

// ─────────────────────────────────────────
// applyCreate
// ─────────────────────────────────────────

describe('applyCreate', () => {
  it('adds a new item', () => {
    const newId = 2_000_000
    expect(items.has(newId)).toBe(false)
    expect(applyCreate(newId)).toBe(true)
    expect(items.has(newId)).toBe(true)
    items.delete(newId) // cleanup so other tests are unaffected
  })

  it('returns false for an existing id', () => {
    expect(applyCreate(1)).toBe(false)
  })
})

// ─────────────────────────────────────────
// getUnselectedPage
// ─────────────────────────────────────────

describe('getUnselectedPage', () => {
  it('excludes selected items', () => {
    applySelect([1, 2, 3])
    const page = getUnselectedPage(undefined, 1, 20)
    expect(page.items.map(i => i.id)).not.toContain(1)
    expect(page.items.map(i => i.id)).not.toContain(2)
    expect(page.items.map(i => i.id)).not.toContain(3)
  })

  it('paginates correctly', () => {
    const p1 = getUnselectedPage(undefined, 1, 5)
    const p2 = getUnselectedPage(undefined, 2, 5)
    expect(p1.items).toHaveLength(5)
    expect(p2.items).toHaveLength(5)
    const p1ids = p1.items.map(i => i.id)
    const p2ids = p2.items.map(i => i.id)
    expect(p1ids.some(id => p2ids.includes(id))).toBe(false)
  })

  it('filters by id substring', () => {
    const page = getUnselectedPage('12345', 1, 20)
    expect(page.items.every(i => String(i.id).includes('12345'))).toBe(true)
  })

  it('returns correct total when filtered', () => {
    const page = getUnselectedPage('99999', 1, 20)
    expect(page.total).toBeGreaterThan(0)
    expect(page.total).toBeLessThan(1_000_000)
  })

  it('returns empty page beyond last page', () => {
    const page = getUnselectedPage('99999999', 1, 20)
    expect(page.items).toHaveLength(0)
    expect(page.total).toBe(0)
  })
})

// ─────────────────────────────────────────
// getSelectedPage
// ─────────────────────────────────────────

describe('getSelectedPage', () => {
  it('returns items in selection order', () => {
    setup([5, 3, 1])
    const page = getSelectedPage(undefined, 1, 20)
    expect(page.items.map(i => i.id)).toEqual([5, 3, 1])
  })

  it('paginates selected list', () => {
    setup([1, 2, 3, 4, 5])
    const p1 = getSelectedPage(undefined, 1, 2)
    const p2 = getSelectedPage(undefined, 2, 2)
    expect(p1.items.map(i => i.id)).toEqual([1, 2])
    expect(p2.items.map(i => i.id)).toEqual([3, 4])
    expect(p1.total).toBe(5)
  })

  it('filters by id substring while preserving order', () => {
    setup([11, 22, 12, 21])
    const page = getSelectedPage('1', 1, 20)
    expect(page.items.map(i => i.id)).toEqual([11, 12, 21])
  })
})
