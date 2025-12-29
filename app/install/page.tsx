"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, CheckCircle2, Smartphone, Monitor, Apple, Chrome } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type InstallState = "idle" | "ready" | "installing" | "installed"

export default function InstallPage() {
  const [installState, setInstallState] = useState<InstallState>("idle")
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia("(display-mode: standalone)").matches
    if (standalone) {
      setIsStandalone(true)
      setInstallState("installed")
      return
    }

    // Check for iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(iOS)

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setInstallState("ready")
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Listen for app installed
    const installedHandler = () => {
      setInstallState("installed")
      setDeferredPrompt(null)
    }
    window.addEventListener("appinstalled", installedHandler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", installedHandler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    setInstallState("installing")
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setInstallState("installed")
    } else {
      setInstallState("ready")
    }
    setDeferredPrompt(null)
  }

  if (isStandalone) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-8">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Already Installed</CardTitle>
            <CardDescription>
              You&apos;re using Lift as an installed app. Enjoy the full experience!
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Install Lift</h1>
        <p className="text-muted-foreground">
          Add Lift to your home screen for the best experience
        </p>
      </div>

      {/* Install button card */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Quick Install
          </CardTitle>
        </CardHeader>
        <CardContent>
          {installState === "ready" && (
            <Button
              onClick={handleInstall}
              variant="gradient"
              size="lg"
              className="w-full"
            >
              <Download className="w-5 h-5 mr-2" />
              Install Lift
            </Button>
          )}
          {installState === "installing" && (
            <Button disabled variant="outline" size="lg" className="w-full">
              Installing...
            </Button>
          )}
          {installState === "installed" && (
            <div className="flex items-center justify-center gap-2 text-green-500 py-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Successfully installed!</span>
            </div>
          )}
          {installState === "idle" && !isIOS && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Your browser will show an install prompt when ready, or use the instructions below.
            </p>
          )}
        </CardContent>
      </Card>

      {/* iOS Instructions */}
      {isIOS && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Apple className="w-5 h-5" />
              Install on iOS
            </CardTitle>
            <CardDescription>
              Follow these steps to add Lift to your home screen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Tap the Share button</p>
                  <p className="text-sm text-muted-foreground">
                    Look for the share icon (square with arrow) at the bottom of Safari
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Scroll and tap &quot;Add to Home Screen&quot;</p>
                  <p className="text-sm text-muted-foreground">
                    You may need to scroll down in the share menu to find it
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Tap &quot;Add&quot;</p>
                  <p className="text-sm text-muted-foreground">
                    Lift will appear on your home screen like any other app
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Why Install?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Smartphone className="w-5 h-5 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Quick Access</p>
              <p className="text-sm text-muted-foreground">
                Launch from your home screen just like a native app
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Monitor className="w-5 h-5 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Full Screen</p>
              <p className="text-sm text-muted-foreground">
                No browser chrome - enjoy a distraction-free experience
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Chrome className="w-5 h-5 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Works Offline</p>
              <p className="text-sm text-muted-foreground">
                Access your workout history even without internet
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop/Android instructions */}
      {!isIOS && installState === "idle" && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Chrome className="w-5 h-5" />
              Install on Chrome
            </CardTitle>
            <CardDescription>
              Manual installation steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Click the install icon</p>
                  <p className="text-sm text-muted-foreground">
                    Look for the install icon in the address bar (right side)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Click &quot;Install&quot;</p>
                  <p className="text-sm text-muted-foreground">
                    Confirm the installation when prompted
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
