import { Router } from 'express'
import { applyReorder } from '../state'

const router = Router()

router.post('/', (req, res) => {
  const { id, afterId } = req.body

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: 'id must be a positive integer' })
    return
  }

  const normalizedAfterId: number | null =
    afterId === null || afterId === undefined ? null : afterId

  if (normalizedAfterId !== null && (!Number.isInteger(normalizedAfterId) || normalizedAfterId <= 0)) {
    res.status(400).json({ message: 'afterId must be a positive integer or null' })
    return
  }

  if (!applyReorder(id, normalizedAfterId)) {
    res.status(400).json({ message: 'Item not in selection or afterId not found' })
    return
  }

  res.status(200).end()
})

export default router
