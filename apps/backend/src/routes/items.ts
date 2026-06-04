import { Router } from 'express'
import { getUnselectedPage } from '../state'
import { enqueueCreate } from '../queue'

const router = Router()

router.get('/', (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
  const filter = req.query.filter ? String(req.query.filter) : undefined
  res.json(getUnselectedPage(filter, page, limit))
})

router.post('/', (req, res) => {
  const id = Number(req.body?.id)
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: 'id must be a positive integer' })
    return
  }
  if (!enqueueCreate(id)) {
    res.status(409).json({ message: `Item with id ${id} already exists` })
    return
  }
  res.status(202).json({ id })
})

export default router
