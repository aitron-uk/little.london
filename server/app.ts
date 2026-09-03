import cors from 'cors'
import express from 'express'
import {
  StoreError,
  createAppointment,
  deleteAppointment,
  getSettings,
  getStore,
  listAppointments,
  updateAppointment,
  updateSettings,
} from './store'

export const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/store', async (_req, res) => {
  try {
    res.json(await getStore())
  } catch (err) {
    handleError(res, err)
  }
})

app.get('/api/settings', async (_req, res) => {
  try {
    res.json(await getSettings())
  } catch (err) {
    handleError(res, err)
  }
})

app.put('/api/settings', async (req, res) => {
  try {
    res.json(await updateSettings(req.body))
  } catch (err) {
    handleError(res, err)
  }
})

app.get('/api/appointments', async (req, res) => {
  try {
    const date = typeof req.query.date === 'string' ? req.query.date : undefined
    res.json(await listAppointments(date))
  } catch (err) {
    handleError(res, err)
  }
})

app.post('/api/appointments', async (req, res) => {
  try {
    const created = await createAppointment(req.body)
    res.status(201).json(created)
  } catch (err) {
    handleError(res, err)
  }
})

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const updated = await updateAppointment(req.params.id, req.body)
    res.json(updated)
  } catch (err) {
    handleError(res, err)
  }
})

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    await deleteAppointment(req.params.id)
    res.status(204).end()
  } catch (err) {
    handleError(res, err)
  }
})

function handleError(res: express.Response, err: unknown): void {
  if (err instanceof StoreError) {
    res.status(err.status).json({
      error: err.message,
      conflict: err.conflict ?? null,
    })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
