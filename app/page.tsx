"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "@/components/layout/main-layout"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { BarChart3, Users, Zap, Shield, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const features = [
    {
      icon: BarChart3,
      title: "Real-time Results",
      description: "See poll results update in real-time as votes come in"
    },
    {
      icon: Users,
      title: "Easy Sharing",
      description: "Share your polls with a simple link and reach your audience"
    },
    {
      icon: Zap,
      title: "Quick Setup",
      description: "Create polls in seconds with our intuitive interface"
    },
    {
      icon: Shield,
      title: "Secure Voting",
      description: "Prevent duplicate votes and ensure data integrity"
    }
  ]

  return (
    <MainLayout showNavbar={false}>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
          <PageWrapper>
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Create Polls That
                <span className="text-blue-600"> Matter</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Build engaging polls, collect valuable feedback, and make data-driven decisions with our modern polling platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </PageWrapper>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <PageWrapper>
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Everything you need to create amazing polls
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our platform provides all the tools you need to create, share, and analyze polls effectively.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card key={index} className="text-center border-0 shadow-lg">
                    <CardHeader>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </PageWrapper>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-50">
          <PageWrapper>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to start polling?
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
                Join thousands of users who trust PollApp for their polling needs.
              </p>
              <Link href="/auth/register">
                <Button size="lg">
                  Create Your First Poll
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </PageWrapper>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <PageWrapper>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-gray-400">
                © 2024 PollApp. Built with Next.js and Tailwind CSS.
              </p>
            </div>
          </PageWrapper>
        </footer>
      </div>
    </MainLayout>
  )
}
