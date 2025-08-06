import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Search, TrendingUp, Zap, BarChart3, Users } from 'lucide-react'

export default function LandingPage() {
 return (
   <div className="flex flex-col min-h-screen">
     {/* Header */}
     <header className="px-4 lg:px-6 h-14 flex items-center border-b">
       <Link className="flex items-center justify-center" href="/">
         <Zap className="h-6 w-6 text-primary mr-2" />
         <span className="font-bold text-xl gradient-text">RecipeRankPro</span>
       </Link>
       <nav className="ml-auto flex gap-4 sm:gap-6">
         <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
           Features
         </Link>
         <Link className="text-sm font-medium hover:text-primary transition-colors" href="#pricing">
           Pricing
         </Link>
         <Link className="text-sm font-medium hover:text-primary transition-colors" href="/auth/login">
           Login
         </Link>
       </nav>
     </header>

     <main className="flex-1">
       {/* Hero Section */}
       <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary-50 to-orange-100">
         <div className="container px-4 md:px-6">
           <div className="flex flex-col items-center space-y-4 text-center">
             <div className="space-y-2">
               <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                 Turn Your Food Blog Into a{' '}
                 <span className="gradient-text">Traffic Magnet</span>
               </h1>
               <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl">
                 AI-powered SEO optimization for food bloggers. Increase organic traffic by 5x with recipe schema markup, keyword optimization, and competitor analysis.
               </p>
             </div>
             <div className="space-x-4">
               <Button asChild size="lg">
                 <Link href="/auth/register">Start Free Trial</Link>
               </Button>
               <Button variant="outline" size="lg">
                 <Link href="#demo">Watch Demo</Link>
               </Button>
             </div>
           </div>
         </div>
       </section>

       {/* Features Section */}
       <section id="features" className="w-full py-12 md:py-24 lg:py-32">
         <div className="container px-4 md:px-6">
           <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
             <Card>
               <CardHeader>
                 <Search className="h-8 w-8 text-primary mb-2" />
                 <CardTitle>AI Recipe Analysis</CardTitle>
                 <CardDescription>
                   Get instant SEO scores and optimization suggestions for your recipes using advanced AI analysis.
                 </CardDescription>
               </CardHeader>
             </Card>
             <Card>
               <CardHeader>
                 <BarChart3 className="h-8 w-8 text-primary mb-2" />
                 <CardTitle>Schema Markup Generator</CardTitle>
                 <CardDescription>
                   Automatically generate recipe schema markup to appear in Google's recipe carousel and rich snippets.
                 </CardDescription>
               </CardHeader>
             </Card>
             <Card>
               <CardHeader>
                 <TrendingUp className="h-8 w-8 text-primary mb-2" />
                 <CardTitle>Competitor Analysis</CardTitle>
                 <CardDescription>
                   See what top-ranking recipes include and discover content gaps in your niche.
                 </CardDescription>
               </CardHeader>
             </Card>
           </div>
         </div>
       </section>

       {/* Pricing Section */}
       <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
         <div className="container px-4 md:px-6">
           <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
             <Card>
               <CardHeader>
                 <CardTitle>Starter</CardTitle>
                 <CardDescription>Perfect for new food bloggers</CardDescription>
                 <div className="text-3xl font-bold">$29<span className="text-sm font-normal">/month</span></div>
               </CardHeader>
               <CardContent>
                 <ul className="space-y-2">
                   <li className="flex items-center">
                     <Check className="h-4 w-4 text-green-500 mr-2" />
                     10 recipe analyses/month
                   </li>
                   <li className="flex items-center">
                     <Check className="h-4 w-4 text-green-500 mr-2" />
                     Basic SEO optimization
                   </li>
                   <li className="flex items-center">
                     <Check className="h-4 w-4 text-green-500 mr-2" />
                     Recipe schema generator
                   </li>
                   <li className="flex items-center">
                     <Check className="h-4 w-4 text-green-500 mr-2" />
                     Email support
                   </li>
                 </ul>
                 <Button className="w-full mt-4" asChild>
                   <Link href="/auth/register?plan=starter">Get Started</Link>
                 </Button>
               </CardContent>
             </Card>

             <Card className="border-primary">
               <CardHeader>
                 <CardTitle>Pro</CardTitle>
                 <CardDescription>Most popular for growing blogs</CardDescription>
                 <div className="text-3xl font-bold">$69<span className="text-sm font-normal">/month</span></div>
               </CardHeader>
               <CardContent>
                 <ul className="space-y-2">
                   <li className="flex items-center">
                     <Check className="h-4 w-4 text-green-500 mr-2" />
                     50 recipe analyses/month
                   </li>
                   <li className="flex items-center">
                     <Check className="h-4 w-4 text-green-500 mr-2" />
                     Advanced keyword research
                   </li>
                   <li className="flex items-center">
                     <Check className="h-4 w-4 text-green-500 mr-2" />
                     Competitor analysis
                   </li>
                   <li className="flex items-center">
                     <Check className="h-4 w-4 text-green-500 mr-2" />
                     Content decay monitoring
                   </li>
                   <li className="flex items-center">
                     <Check className="h-4 w-4 text-green-500 mr-2" />
                     Priority support
                   </li>
                 </ul>
                 <Button className="w-full mt-4" asChild>
                   <Link href="/auth/register?plan=pro">Get Started</Link>
                 </Button>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle>Agency</CardTitle>
                 <CardDescription>For agencies and large sites</CardDescription>
                 <div className="text-3xl font-bold">$149<span className="text-sm font-normal">/month</span></div>
               </CardHeader>
               <CardContent>
                 <ul className="space-y-2">
                   <li className="flex items-center">
                     <Check className="h-4 w-4 text-green-500 mr-2" />
                     Unlimited analyses
                   </li>
                   <li className="flex items-center">
                     <Check className="h-4 w-4 text-green-500 mr-2" />
                     White-label options
                   </li>
                   <li className="flex items-center">
                     <Check className="h-4 w-4 text-green-500 mr-2" />
                     Team collaboration
                   </li>
                   <li className="flex items-center">
                     <Check className="h-4 w-4 text-green-500 mr-2" />
                     Custom integrations
                   </li>
                   <li className="flex items-center">
                     <Check className="h-4 w-4 text-green-500 mr-2" />
                     Phone support
                   </li>
                 </ul>
                 <Button className="w-full mt-4" asChild>
                   <Link href="/auth/register?plan=agency">Get Started</Link>
                 </Button>
               </CardContent>
             </Card>
           </div>
         </div>
       </section>
     </main>

     {/* Footer */}
     <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
       <p className="text-xs text-gray-500">© 2024 RecipeRankPro. All rights reserved.</p>
       <nav className="sm:ml-auto flex gap-4 sm:gap-6">
         <Link className="text-xs hover:underline underline-offset-4" href="/terms">
           Terms of Service
         </Link>
         <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
           Privacy
         </Link>
       </nav>
     </footer>
   </div>
 )
}
