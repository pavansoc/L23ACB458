"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Card,
  CardContent,
  Chip,
  IconButton,
  Snackbar,
} from "@mui/material"
import { ContentCopy, Delete, Analytics, Link as LinkIcon } from "@mui/icons-material"
import Link from "next/link"

interface ShortenedUrl {
  id: string
  originalUrl: string
  shortCode: string
  shortUrl: string
  createdAt: Date
  expiresAt: Date
  customCode?: string
  clicks: number
}

interface UrlFormData {
  url: string
  customCode: string
  validityMinutes: number
}

export default function URLShortenerPage() {
  const [urls, setUrls] = useState<ShortenedUrl[]>([])
  const [formData, setFormData] = useState<UrlFormData>({
    url: "",
    customCode: "",
    validityMinutes: 30,
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [snackbar, setSnackbar] = useState({ open: false, message: "" })

  useEffect(() => {
    const savedUrls = localStorage.getItem("shortenedUrls")
    if (savedUrls) {
      const parsedUrls = JSON.parse(savedUrls).map((url: any) => ({
        ...url,
        createdAt: new Date(url.createdAt),
        expiresAt: new Date(url.expiresAt),
      }))
      setUrls(parsedUrls)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("shortenedUrls", JSON.stringify(urls))
  }, [urls])

  const logEvent = (event: string, data: any) => {
    console.log(`[URL_SHORTENER_LOG] ${event}:`, data)
  }

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const validateCustomCode = (code: string): boolean => {
    if (!code) return true
    return /^[a-zA-Z0-9_-]{3,20}$/.test(code)
  }

  const isCustomCodeUnique = (code: string): boolean => {
    return !urls.some((url) => url.shortCode === code)
  }

  const generateShortCode = (): string => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    setErrors({})

    const newErrors: { [key: string]: string } = {}

    if (!formData.url) {
      newErrors.url = "URL is required"
    } else if (!validateUrl(formData.url)) {
      newErrors.url = "Please enter a valid URL"
    }

    if (formData.customCode && !validateCustomCode(formData.customCode)) {
      newErrors.customCode = "Custom code must be 3-20 characters (letters, numbers, _, -)"
    }

    if (formData.customCode && !isCustomCodeUnique(formData.customCode)) {
      newErrors.customCode = "This custom code is already taken"
    }

    if (formData.validityMinutes < 1 || formData.validityMinutes > 10080) {
      newErrors.validityMinutes = "Validity must be between 1 and 10080 minutes (1 week)"
    }

    if (urls.length >= 5) {
      newErrors.general = "Maximum of 5 URLs can be shortened concurrently"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      logEvent("VALIDATION_ERROR", { errors: newErrors, formData })
      return
    }

    let shortCode = formData.customCode
    if (!shortCode) {
      do {
        shortCode = generateShortCode()
      } while (!isCustomCodeUnique(shortCode))
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + formData.validityMinutes * 60000)

    const newUrl: ShortenedUrl = {
      id: Date.now().toString(),
      originalUrl: formData.url,
      shortCode,
      shortUrl: `${window.location.origin}/${shortCode}`,
      createdAt: now,
      expiresAt,
      customCode: formData.customCode || undefined,
      clicks: 0,
    }

    setUrls((prev) => [...prev, newUrl])

    setFormData({
      url: "",
      customCode: "",
      validityMinutes: 30,
    })

    setSnackbar({
      open: true,
      message: "URL shortened successfully!",
    })

    logEvent("URL_SHORTENED", newUrl)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSnackbar({
      open: true,
      message: "Copied to clipboard!",
    })
    logEvent("URL_COPIED", { shortUrl: text })
  }

  const deleteUrl = (id: string) => {
    const urlToDelete = urls.find((url) => url.id === id)
    setUrls((prev) => prev.filter((url) => url.id !== id))
    setSnackbar({
      open: true,
      message: "URL deleted successfully!",
    })
    logEvent("URL_DELETED", urlToDelete)
  }

  const isExpired = (expiresAt: Date): boolean => {
    return new Date() > expiresAt
  }

  return (
    <Container maxWidth="md" style={{ paddingTop: 32, paddingBottom: 32 }}>
      <Paper elevation={3} style={{ padding: 32, marginBottom: 32 }}>
        <Box style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <LinkIcon style={{ marginRight: 16, fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            URL Shortener
          </Typography>
        </Box>

        <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Typography variant="body1">Shorten up to 5 URLs concurrently with custom codes and analytics</Typography>
          <Button component={Link} href="/statistics" variant="outlined" startIcon={<Analytics />}>
            View Statistics
          </Button>
        </Box>

        {errors.general && (
          <Alert severity="error" style={{ marginBottom: 24 }}>
            {errors.general}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
          <TextField
            fullWidth
            label="Enter URL to shorten"
            value={formData.url}
            onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
            error={!!errors.url}
            helperText={errors.url}
            style={{ marginBottom: 16 }}
            placeholder="https://example.com/very-long-url"
          />

          <Box style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <TextField
              label="Custom Short Code (Optional)"
              value={formData.customCode}
              onChange={(e) => setFormData((prev) => ({ ...prev, customCode: e.target.value }))}
              error={!!errors.customCode}
              helperText={errors.customCode}
              style={{ flex: 1 }}
              placeholder="my-link"
            />

            <TextField
              type="number"
              label="Validity (Minutes)"
              value={formData.validityMinutes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, validityMinutes: Number.parseInt(e.target.value) || 30 }))
              }
              error={!!errors.validityMinutes}
              helperText={errors.validityMinutes}
              style={{ width: 200 }}
              inputProps={{ min: 1, max: 10080 }}
            />
          </Box>

          <Button type="submit" variant="contained" size="large" disabled={urls.length >= 5}>
            Shorten URL
          </Button>
        </Box>

        <Typography variant="h6" style={{ marginBottom: 16 }}>
          Your Shortened URLs ({urls.length}/5)
        </Typography>

        {urls.length === 0 ? (
          <Alert severity="info">No URLs shortened yet. Create your first short link above!</Alert>
        ) : (
          <Box style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {urls.map((url) => (
              <Card key={url.id} variant="outlined">
                <CardContent>
                  <Box
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 16,
                    }}
                  >
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Original URL
                      </Typography>
                      <Typography
                        variant="body2"
                        style={{
                          wordBreak: "break-all",
                          marginBottom: 8,
                          color: isExpired(url.expiresAt) ? "#999" : "inherit",
                        }}
                      >
                        {url.originalUrl}
                      </Typography>

                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Short URL
                      </Typography>
                      <Box style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <Typography
                          variant="body2"
                          style={{
                            fontFamily: "monospace",
                            color: isExpired(url.expiresAt) ? "#999" : "#1976d2",
                          }}
                        >
                          {url.shortUrl}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(url.shortUrl)}
                          disabled={isExpired(url.expiresAt)}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <IconButton color="error" onClick={() => deleteUrl(url.id)} style={{ marginLeft: 8 }}>
                      <Delete />
                    </IconButton>
                  </Box>

                  <Box style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {url.customCode && <Chip label="Custom Code" size="small" color="primary" variant="outlined" />}
                    <Chip label={`${url.clicks} clicks`} size="small" />
                    <Chip
                      label={isExpired(url.expiresAt) ? "Expired" : `Expires: ${url.expiresAt.toLocaleString()}`}
                      size="small"
                      color={isExpired(url.expiresAt) ? "error" : "success"}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </Container>
  )
}
