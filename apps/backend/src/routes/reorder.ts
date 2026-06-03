import { Router } from 'express'
import { enqueueReorder } from '../queue'
import { selected } from '../state'

const router = Router()

router.post('/', (req, res) => {
  const order: unknown = req.body?.order
  if (!Array.isArray(order)) {
    res.status(400).json({ message: 'order must be an array' })
    return
  }
  const valid = order.filter((id): id is number => Number.isInteger(id) && id > 0)
  if (valid.length !== selected.size) {
    res.status(400).json({ message: 'order must contain exactly all selected items' })
    return
  }
  for (const id of valid) {
    if (!selected.has(id)) {
      res.status(400).json({ message: `Item ${id} is not in selection` })
      return
    }
  }
  enqueueReorder(valid)
  res.status(200).end()
})

export default router
