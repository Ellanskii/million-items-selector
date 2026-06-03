import { Router } from 'express'
import { enqueueSelect } from '../queue'

const router = Router()

router.post('/', (req, res) => {
  const ids: unknown = req.body?.ids
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ message: 'ids must be a non-empty array' })
    return
  }
  const valid = ids.filter((id): id is number => Number.isInteger(id) && id > 0)
  if (valid.length === 0) {
    res.status(400).json({ message: 'ids must contain positive integers' })
    return
  }
  enqueueSelect(valid)
  res.status(200).end()
})

export default router
