"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Container, Paper, Typography, Box, CircularProgress, Alert, Button } from "@mui/material"
import { Error, Link as LinkIcon } from "@mui/icons-material"
import Link from "next/link"

interface ClickData {
  timestamp: Date
  source: string
  location: string
}

interface ShortenedUrl {
  id: string
  originalUrl: string
  shortCode: string
  shortUrl: string
  createdAt: Date
  expiresAt: Date
  customCode?: string
  clicks: number
  clickData?: ClickData[]
}

export default function RedirectPage() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<ShortenedUrl | null>(null)

  const shortCode = params.shortCode as string

  const logEvent = (event: string, data: any) => {
    console.log(`[URL_SHORTENER_LOG] ${event}:`, data)
  }

  useEffect(() => {
    const handleRedirect = () => {
      try {
        const savedUrls = localStorage.getItem("shortenedUrls")
        if (!savedUrls) {
          setError("URL not found")
          setLoading(false)
          return
        }

        const urls: ShortenedUrl[] = JSON.parse(savedUrls).map((url: any) => ({
          ...url,
          createdAt: new Date(url.createdAt),
          expiresAt: new Date(url.expiresAt),
          clickData:
            url.clickData?.map((click: any) => ({
              ...click,
              timestamp: new Date(click.timestamp),
            })) || [],
        }))

        const foundUrl = urls.find((url) => url.shortCode === shortCode)

        if (!foundUrl) {
          setError("URL not found")
          setLoading(false)
          logEvent("REDIRECT_ERROR", { shortCode, error: "URL not found" })
          return
        }

        if (new Date() > foundUrl.expiresAt) {
          setError("This URL has expired")
          setUrl(foundUrl)
          setLoading(false)
          logEvent("REDIRECT_ERROR", { shortCode, error: "URL expired", url: foundUrl })
          return
        }

        const clickData: ClickData = {
          timestamp: new Date(),
          source: document.referrer || "Direct",
          location: "Unknown",
        }

        const updatedUrl = {
          ...foundUrl,
          clicks: foundUrl.clicks + 1,
          clickData: [...(foundUrl.clickData || []), clickData],
        }

        const updatedUrls = urls.map((url) => (url.id === foundUrl.id ? updatedUrl : url))

        localStorage.setItem("shortenedUrls", JSON.stringify(updatedUrls))

        logEvent("URL_CLICKED", {
          shortCode,
          originalUrl: foundUrl.originalUrl,
          clickData,
          totalClicks: updatedUrl.clicks,
        })

        window.location.href = foundUrl.originalUrl
      } catch (err) {
        setError("An error occurred while processing the redirect")
        setLoading(false)
        logEvent("REDIRECT_ERROR", { shortCode, error: err })
      }
    }

    const timer = setTimeout(handleRedirect, 1000)
    return () => clearTimeout(timer)
  }, [shortCode])

  if (loading) {
    return (
      <Container maxWidth="sm" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <Paper elevation={3} style={{ padding: 32, textAlign: "center" }}>
          <CircularProgress size={60} style={{ marginBottom: 24 }} />
          <Typography variant="h5" gutterBottom>
            Redirecting...
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please wait while we redirect you to your destination.
          </Typography>
        </Paper>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" style={{ paddingTop: 64, paddingBottom: 64 }}>
      <Paper elevation={3} style={{ padding: 32, textAlign: "center" }}>
        <Error style={{ fontSize: 60, marginBottom: 24 }} />

        <Typography variant="h4" gutterBottom>
          Oops! Something went wrong
        </Typography>

        <Alert severity="error" style={{ marginBottom: 24, textAlign: "left" }}>
          {error}
        </Alert>

        {url && (
          <Box style={{ marginBottom: 24, textAlign: "left" }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Short URL Details:
            </Typography>
            <Typography variant="body2" style={{ fontFamily: "monospace", marginBottom: 8 }}>
              {url.shortUrl}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created: {url.createdAt.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Expired: {url.expiresAt.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Clicks: {url.clicks}
            </Typography>
          </Box>
        )}

        <Box style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <Button component={Link} href="/" variant="contained" startIcon={<LinkIcon />}>
            Create New Short URL
          </Button>

          <Button component={Link} href="/statistics" variant="outlined">
            View Statistics
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
