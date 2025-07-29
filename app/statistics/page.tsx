"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Divider,
} from "@mui/material"
import { Analytics, ArrowBack, Link as LinkIcon, AccessTime, Mouse, Language, Source } from "@mui/icons-material"
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

export default function StatisticsPage() {
  const [urls, setUrls] = useState<ShortenedUrl[]>([])

  useEffect(() => {
    const savedUrls = localStorage.getItem("shortenedUrls")
    if (savedUrls) {
      const parsedUrls = JSON.parse(savedUrls).map((url: any) => ({
        ...url,
        createdAt: new Date(url.createdAt),
        expiresAt: new Date(url.expiresAt),
        clickData:
          url.clickData?.map((click: any) => ({
            ...click,
            timestamp: new Date(click.timestamp),
          })) || [],
      }))
      setUrls(parsedUrls)
    }
  }, [])

  const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0)
  const activeUrls = urls.filter((url) => new Date() <= url.expiresAt).length
  const expiredUrls = urls.length - activeUrls

  const isExpired = (expiresAt: Date): boolean => {
    return new Date() > expiresAt
  }

  const formatDuration = (createdAt: Date, expiresAt: Date): string => {
    const diffMs = expiresAt.getTime() - createdAt.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes`
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60)
      return `${hours} hour${hours > 1 ? "s" : ""}`
    } else {
      const days = Math.floor(diffMinutes / 1440)
      return `${days} day${days > 1 ? "s" : ""}`
    }
  }

  return (
    <Container maxWidth="lg" style={{ paddingTop: 32, paddingBottom: 32 }}>
      <Paper elevation={3} style={{ padding: 32 }}>
        <Box style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <Box style={{ display: "flex", alignItems: "center" }}>
            <Analytics style={{ marginRight: 16, fontSize: 32 }} />
            <Typography variant="h4" component="h1">
              URL Statistics
            </Typography>
          </Box>
          <Button component={Link} href="/" variant="outlined" startIcon={<ArrowBack />}>
            Back to Shortener
          </Button>
        </Box>

        <Box
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <Card variant="outlined">
            <CardContent style={{ textAlign: "center" }}>
              <LinkIcon style={{ fontSize: 40, marginBottom: 8 }} />
              <Typography variant="h4">{urls.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total URLs
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent style={{ textAlign: "center" }}>
              <Mouse style={{ fontSize: 40, marginBottom: 8 }} />
              <Typography variant="h4">{totalClicks}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Clicks
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent style={{ textAlign: "center" }}>
              <AccessTime style={{ fontSize: 40, marginBottom: 8 }} />
              <Typography variant="h4">{activeUrls}</Typography>
              <Typography variant="body2" color="text.secondary">
                Active URLs
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent style={{ textAlign: "center" }}>
              <AccessTime style={{ fontSize: 40, marginBottom: 8 }} />
              <Typography variant="h4">{expiredUrls}</Typography>
              <Typography variant="body2" color="text.secondary">
                Expired URLs
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {urls.length === 0 ? (
          <Alert severity="info">
            No URLs have been shortened yet. <Link href="/">Create your first short link</Link> to see statistics here.
          </Alert>
        ) : (
          <Box>
            <Typography variant="h5" style={{ marginBottom: 24 }}>
              Detailed URL Statistics
            </Typography>

            {urls.map((url) => (
              <Card key={url.id} variant="outlined" style={{ marginBottom: 24 }}>
                <CardContent>
                  <Box style={{ marginBottom: 16 }}>
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 16,
                      }}
                    >
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" gutterBottom>
                          {url.shortCode}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          style={{ wordBreak: "break-all", marginBottom: 8 }}
                        >
                          {url.originalUrl}
                        </Typography>
                        <Typography
                          variant="body2"
                          style={{
                            fontFamily: "monospace",
                            color: isExpired(url.expiresAt) ? "#999" : "#1976d2",
                          }}
                        >
                          {url.shortUrl}
                        </Typography>
                      </Box>

                      <Box style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {url.customCode && <Chip label="Custom" size="small" color="primary" variant="outlined" />}
                        <Chip
                          label={isExpired(url.expiresAt) ? "Expired" : "Active"}
                          size="small"
                          color={isExpired(url.expiresAt) ? "error" : "success"}
                        />
                      </Box>
                    </Box>

                    <Divider style={{ margin: "16px 0" }} />

                    <Box
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 16,
                        marginBottom: 16,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Created
                        </Typography>
                        <Typography variant="body2">{url.createdAt.toLocaleString()}</Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Expires
                        </Typography>
                        <Typography variant="body2">{url.expiresAt.toLocaleString()}</Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Validity Period
                        </Typography>
                        <Typography variant="body2">{formatDuration(url.createdAt, url.expiresAt)}</Typography>
                      </Box>
                    </Box>

                    <Box style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                      <Box style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Mouse />
                        <Typography variant="h6">{url.clicks} clicks</Typography>
                      </Box>
                    </Box>
                  </Box>

                  {url.clickData && url.clickData.length > 0 && (
                    <Box>
                      <Typography
                        variant="subtitle1"
                        style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <Analytics />
                        Click Details
                      </Typography>

                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Timestamp</TableCell>
                              <TableCell>Source</TableCell>
                              <TableCell>Location</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {url.clickData.map((click, index) => (
                              <TableRow key={index}>
                                <TableCell>{click.timestamp.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Box style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Source fontSize="small" />
                                    {click.source}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Language fontSize="small" />
                                    {click.location}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}

                  {(!url.clickData || url.clickData.length === 0) && url.clicks === 0 && (
                    <Alert severity="info" style={{ marginTop: 16 }}>
                      No clicks recorded yet for this URL.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    </Container>
  )
}
