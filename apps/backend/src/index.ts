import express from 'express'
import cors from 'cors'
import itemsRouter from './routes/items'
import selectedRouter from './routes/selected'
import selectRouter from './routes/select'
import unselectRouter from './routes/unselect'
import reorderRouter from './routes/reorder'
import { startQueue } from './queue'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.use('/items', itemsRouter)
app.use('/selected', selectedRouter)
app.use('/select', selectRouter)
app.use('/unselect', unselectRouter)
app.use('/reorder', reorderRouter)

startQueue()

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
