import express from 'express'
import cors from 'cors'
import itemsRouter from './routes/items'
import selectedRouter from './routes/selected'
import selectRouter from './routes/select'
import unselectRouter from './routes/unselect'
import reorderRouter from './routes/reorder'
const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN ?? '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}))
app.use(express.json())

app.get('/health', (_, res) => res.sendStatus(200))

app.use('/items', itemsRouter)
app.use('/selected', selectedRouter)
app.use('/select', selectRouter)
app.use('/unselect', unselectRouter)
app.use('/reorder', reorderRouter)

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
