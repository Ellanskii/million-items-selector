import { applySelect, applyUnselect, applyReorder } from './state'

type Op =
  | { type: 'select'; ids: number[] }
  | { type: 'unselect'; ids: number[] }
  | { type: 'reorder'; order: number[] }

const ops: Op[] = []

export function enqueueSelect(ids: number[]): void {
  const last = ops[ops.length - 1]
  if (last?.type === 'select') {
    const merged = new Set(last.ids)
    for (const id of ids) merged.add(id)
    last.ids = [...merged]
    return
  }
  ops.push({ type: 'select', ids: [...new Set(ids)] })
}

export function enqueueUnselect(ids: number[]): void {
  const last = ops[ops.length - 1]
  if (last?.type === 'unselect') {
    const merged = new Set(last.ids)
    for (const id of ids) merged.add(id)
    last.ids = [...merged]
    return
  }
  ops.push({ type: 'unselect', ids: [...new Set(ids)] })
}

export function enqueueReorder(newOrder: number[]): void {
  let idx = -1
  for (let i = ops.length - 1; i >= 0; i--) {
    if (ops[i].type === 'reorder') { idx = i; break }
  }
  const op: Op = { type: 'reorder', order: newOrder }
  if (idx !== -1) ops[idx] = op
  else ops.push(op)
}

function flush(): void {
  if (ops.length === 0) return
  const batch = ops.splice(0)
  for (const op of batch) {
    if (op.type === 'select') applySelect(op.ids)
    else if (op.type === 'unselect') applyUnselect(op.ids)
    else if (op.type === 'reorder') applyReorder(op.order)
  }
}

export function startQueue(): void {
  setInterval(flush, 1_000)
}
