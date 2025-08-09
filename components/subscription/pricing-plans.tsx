'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Zap, TrendingUp, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface PricingPlan {
  id: 'starter' | 'pro' | 'agency'
  name: string
  description: string
  price: number
  icon: React.ReactNode
  features: string[]
  popular?: boolean
  buttonText: string
}

const plans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for new food bloggers',
    price: 29,
    icon: <Zap className="w-6 h-6 text-orange-600" />,
    features: [
      '10 recipe analyses/month',
      'Basic SEO optimization',
      'Recipe schema generator',
      'Email support'
    ],
    buttonText: 'Get Started'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Most popular for growing blogs',
    price: 69,
    icon: <TrendingUp className="w-6 h-6 text-orange-600" />,
    features: [
      '50 recipe analyses/month',
      'Advanced keyword research',
      'Competitor analysis',
      'Content decay monitoring',
      'Priority support'
    ],
    popular: true,
    buttonText: 'Get Started'
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'For agencies and large sites',
    price: 149,
    icon: <Users className="w-6 h-6 text-orange-600" />,
    features: [
      'Unlimited analyses',
      'White-label options',
      'Team collaboration',
      'Custom integrations',
      'Phone support'
    ],
    buttonText: 'Get Started'
  }
]

export default function PricingPlans() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      router.push('/auth/register')
      return
    }

    setLoading(planId)
    
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: session.user.id,
        }),
      })

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned:', data)
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="py-20 px-4 bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start optimizing your recipes today and watch your traffic grow
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-orange-500 border-2 shadow-xl scale-105' : 'border-gray-200'}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className="mx-auto mb-4">
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600 mb-4">
                  {plan.description}
                </CardDescription>
                <div className="text-center">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-orange-600 hover:bg-orange-700' 
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                  size="lg"
                >
                  {loading === plan.id ? 'Loading...' : plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">
            All plans include a 14-day free trial. Cancel anytime. No setup fees.
          </p>
        </div>
      </div>
    </div>
  )
}
