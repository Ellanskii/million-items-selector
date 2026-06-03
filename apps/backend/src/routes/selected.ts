import { Router } from 'express'
import { getSelectedPage } from '../state'

const router = Router()

router.get('/', (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20))
  const filter = req.query.filter ? String(req.query.filter) : undefined
  res.json(getSelectedPage(filter, page, limit))
})

export default router
