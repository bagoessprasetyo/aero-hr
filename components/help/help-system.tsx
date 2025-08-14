"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { 
  ProfessionalCard,
  ActionButton 
} from "@/components/ui/professional"
import {
  HelpCircle,
  Search,
  Book,
  Video,
  MessageCircle,
  Keyboard,
  Users,
  Calculator,
  FileText,
  Building2,
  ChevronRight,
  ExternalLink,
  Play,
  Download,
  Mail,
  Phone,
  Clock,
  Eye
} from "lucide-react"
import { cn } from "@/lib/utils"
import { HelpArticleReader } from "./help-article-reader"

interface HelpArticle {
  id: string
  title: string
  description: string
  category: 'getting-started' | 'employees' | 'payroll' | 'compliance' | 'advanced'
  type: 'article' | 'video' | 'tutorial'
  readTime?: number
  url?: string
  popular?: boolean
}

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  helpful?: number
}

const helpArticles: HelpArticle[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with Aero HR',
    description: 'Complete guide to setting up and using Aero HR for Indonesian payroll management',
    category: 'getting-started',
    type: 'tutorial',
    readTime: 10,
    popular: true
  },
  {
    id: 'employee-management',
    title: 'Employee Management Guide',
    description: 'Learn how to manage employee profiles, salary components, and personal data effectively',
    category: 'employees',
    type: 'article',
    readTime: 8,
    popular: true
  },
  {
    id: 'payroll-calculation',
    title: 'Payroll Calculation Process',
    description: 'Step-by-step guide to calculating and processing monthly payroll with Indonesian compliance',
    category: 'payroll',
    type: 'tutorial',
    readTime: 12
  },
  {
    id: 'pph21-guide',
    title: 'PPh 21 Tax Configuration',
    description: 'Complete guide to setting up and managing Indonesian income tax calculations',
    category: 'compliance',
    type: 'article',
    readTime: 15
  },
  {
    id: 'salary-components',
    title: 'Managing Salary Components',
    description: 'Configure basic salary and allowances for employees',
    category: 'employees',
    type: 'tutorial',
    readTime: 8
  },
  {
    id: 'bpjs-setup',
    title: 'BPJS Enrollment Management',
    description: 'Managing employee BPJS health and employment insurance',
    category: 'compliance',
    type: 'article',
    readTime: 8
  },
  {
    id: 'bulk-operations',
    title: 'Bulk Salary Adjustments',
    description: 'Performing mass salary changes across multiple employees',
    category: 'advanced',
    type: 'tutorial',
    readTime: 10
  },
  {
    id: 'compliance-reports',
    title: 'Exporting Compliance Reports',
    description: 'Generate and export reports for government compliance',
    category: 'compliance',
    type: 'article',
    readTime: 6
  }
]

const faqItems: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do I calculate PPh 21 for different PTKP status?',
    answer: 'Aero HR automatically calculates PPh 21 based on the employee\'s PTKP status. The system uses the latest Indonesian tax brackets and considers allowances, BPJS contributions, and occupational costs.',
    category: 'Tax & Compliance'
  },
  {
    id: 'faq-2',
    question: 'Can I import employee data from Excel?',
    answer: 'Currently, employee data must be entered manually through the system. We recommend using the bulk operations feature for mass salary adjustments.',
    category: 'Employee Management'
  },
  {
    id: 'faq-3',
    question: 'How do I handle BPJS contribution changes?',
    answer: 'BPJS contributions are calculated automatically based on the employee\'s gross salary and enrollment status. You can update enrollment status in the employee profile.',
    category: 'BPJS & Benefits'
  },
  {
    id: 'faq-4',
    question: 'What reports are available for compliance?',
    answer: 'Aero HR provides PPh 21 monthly reports, BPJS contribution summaries, salary history exports, and custom compliance reports that can be exported in Excel or PDF format.',
    category: 'Reports & Export'
  },
  {
    id: 'faq-5',
    question: 'How do I backup my payroll data?',
    answer: 'All data is automatically backed up in the cloud. You can also export your data using the Export & Compliance feature in Bulk Operations.',
    category: 'Data Management'
  }
]

export function HelpSystem() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredArticles, setFilteredArticles] = useState(helpArticles)
  const [filteredFAQs, setFilteredFAQs] = useState(faqItems)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Check if we should show an article
  const articleId = searchParams.get('article')
  const shouldShowArticle = articleId && helpArticles.some(article => article.id === articleId)

  const handleArticleClick = (articleId: string) => {
    router.push(`/help?article=${articleId}`)
  }

  useEffect(() => {
    let filtered = helpArticles

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory)
    }

    setFilteredArticles(filtered)

    // Filter FAQs
    let filteredFAQ = faqItems
    if (searchQuery) {
      filteredFAQ = filteredFAQ.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    setFilteredFAQs(filteredFAQ)
  }, [searchQuery, selectedCategory])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'employees': return <Users className="h-4 w-4" />
      case 'payroll': return <Calculator className="h-4 w-4" />
      case 'compliance': return <FileText className="h-4 w-4" />
      case 'advanced': return <Building2 className="h-4 w-4" />
      default: return <Book className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4 text-red-600" />
      case 'tutorial': return <Play className="h-4 w-4 text-blue-600" />
      default: return <Book className="h-4 w-4 text-green-600" />
    }
  }

  const categories = [
    { id: 'all', label: 'All Categories', icon: Book },
    { id: 'getting-started', label: 'Getting Started', icon: Play },
    { id: 'employees', label: 'Employee Management', icon: Users },
    { id: 'payroll', label: 'Payroll Processing', icon: Calculator },
    { id: 'compliance', label: 'Tax & Compliance', icon: FileText },
    { id: 'advanced', label: 'Advanced Features', icon: Building2 }
  ]

  // If we should show an article, render the article reader instead
  if (shouldShowArticle) {
    return <HelpArticleReader />
  }

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <ProfessionalCard variant="elevated" className="text-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <HelpCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            Help & Support Center
          </CardTitle>
          <CardDescription className="text-lg max-w-3xl mx-auto leading-relaxed">
            Master Aero HR with comprehensive guides, video tutorials, and expert support for Indonesian payroll compliance
          </CardDescription>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Badge variant="secondary" className="px-3 py-1">
              <Users className="h-3 w-3 mr-1" />
              24/7 Support
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Book className="h-3 w-3 mr-1" />
              Complete Guides
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Video className="h-3 w-3 mr-1" />
              Video Tutorials
            </Badge>
          </div>
        </CardHeader>
      </ProfessionalCard>

      {/* Enhanced Search */}
      <ProfessionalCard className="max-w-3xl mx-auto">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search help articles, tutorials, FAQs, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-20 h-14 text-base rounded-xl border-2 focus:border-primary/50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <kbd className="pointer-events-none h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs text-muted-foreground hidden sm:inline-flex">
                Ctrl K
              </kbd>
            </div>
          </div>
          {searchQuery && (
            <div className="mt-4 text-sm text-muted-foreground">
              Found {filteredArticles.length + filteredFAQs.length} results for "{searchQuery}"
            </div>
          )}
        </CardContent>
      </ProfessionalCard>

      {/* Enhanced Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
        <Dialog>
          <DialogTrigger asChild>
            <ProfessionalCard variant="interactive" className="group">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                  <Keyboard className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-1">Keyboard Shortcuts</h3>
                <p className="text-xs text-muted-foreground">Navigate faster with hotkeys</p>
              </CardContent>
            </ProfessionalCard>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription>Master these shortcuts to work more efficiently</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Navigation</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Dashboard</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="font-mono text-xs">G</Badge>
                        <Badge variant="outline" className="font-mono text-xs">D</Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Employees</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="font-mono text-xs">G</Badge>
                        <Badge variant="outline" className="font-mono text-xs">E</Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Payroll</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="font-mono text-xs">G</Badge>
                        <Badge variant="outline" className="font-mono text-xs">P</Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Help Center</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="font-mono text-xs">G</Badge>
                        <Badge variant="outline" className="font-mono text-xs">H</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Actions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Command Palette</span>
                      <Badge variant="outline" className="font-mono text-xs">Ctrl K</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Quick Help</span>
                      <Badge variant="outline" className="font-mono text-xs">?</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Search Help</span>
                      <Badge variant="outline" className="font-mono text-xs">Ctrl H</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Close Modal</span>
                      <Badge variant="outline" className="font-mono text-xs">Esc</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <ProfessionalCard variant="interactive" className="group cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3 group-hover:bg-green-200 transition-colors">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-1">Contact Support</h3>
            <p className="text-xs text-muted-foreground">Get help from our experts</p>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="interactive" className="group cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-1">Download Guide</h3>
            <p className="text-xs text-muted-foreground">Complete PDF handbook</p>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="interactive" className="group cursor-pointer">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-3 group-hover:bg-red-200 transition-colors">
              <Video className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-semibold mb-1">Video Tutorials</h3>
            <p className="text-xs text-muted-foreground">Learn with visual guides</p>
          </CardContent>
        </ProfessionalCard>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="articles" className="space-y-8">
        <ProfessionalCard className="max-w-2xl mx-auto">
          <CardContent className="p-2">
            <TabsList className="grid w-full grid-cols-4 h-12">
              <TabsTrigger value="articles" className="text-sm">
                <Book className="h-4 w-4 mr-2" />
                Articles
              </TabsTrigger>
              <TabsTrigger value="videos" className="text-sm">
                <Video className="h-4 w-4 mr-2" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="faqs" className="text-sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                FAQs
              </TabsTrigger>
              <TabsTrigger value="contact" className="text-sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </ProfessionalCard>

        <TabsContent value="articles" className="space-y-8">
          {/* Enhanced Categories */}
          <ProfessionalCard className="max-w-4xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-center">Browse by Category</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map(category => {
                  const articlesCount = helpArticles.filter(article => 
                    category.id === 'all' || article.category === category.id
                  ).length
                  
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="lg"
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex items-center space-x-2 h-12 px-4"
                    >
                      <category.icon className="h-4 w-4" />
                      <span>{category.label}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {articlesCount}
                      </Badge>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </ProfessionalCard>

          {/* Popular Articles */}
          {selectedCategory === 'all' && (
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">🔥 Most Popular Guides</h2>
                <p className="text-muted-foreground">Start with these essential articles</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {helpArticles.filter(article => article.popular).map(article => (
                  <ProfessionalCard 
                    key={article.id} 
                    variant="interactive" 
                    className="group cursor-pointer"
                    onClick={() => handleArticleClick(article.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                            {getTypeIcon(article.type)}
                          </div>
                          <div>
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                              {article.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="destructive" className="text-xs">
                                🔥 Popular
                              </Badge>
                              <Badge variant="outline" className="text-xs capitalize">
                                {article.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <CardDescription className="text-base leading-relaxed mt-3">
                        {article.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-3 text-muted-foreground">
                          {getCategoryIcon(article.category)}
                          <span className="capitalize">{article.category.replace('-', ' ')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{article.readTime} min read</span>
                        </div>
                      </div>
                    </CardContent>
                  </ProfessionalCard>
                ))}
              </div>
            </div>
          )}

          {/* All Articles */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {selectedCategory === 'all' ? '📚 All Help Articles' : `${categories.find(c => c.id === selectedCategory)?.label} Articles`}
              </h2>
              <p className="text-muted-foreground">
                {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} available
              </p>
            </div>
            
            {filteredArticles.length === 0 ? (
              <ProfessionalCard className="text-center py-12">
                <CardContent>
                  <div className="max-w-md mx-auto">
                    <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                    <p className="text-muted-foreground mb-4">
                      We couldn't find any articles matching your search criteria.
                    </p>
                    <Button variant="outline" onClick={() => {
                      setSearchQuery("")
                      setSelectedCategory("all")
                    }}>
                      Clear filters
                    </Button>
                  </div>
                </CardContent>
              </ProfessionalCard>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map(article => (
                  <ProfessionalCard 
                    key={article.id} 
                    variant="interactive" 
                    className="group h-full cursor-pointer"
                    onClick={() => handleArticleClick(article.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-gray-200 transition-colors">
                          {getTypeIcon(article.type)}
                        </div>
                        <Badge variant="outline" className="text-xs uppercase">
                          {article.type}
                        </Badge>
                        {article.popular && (
                          <Badge variant="destructive" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors leading-tight">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {article.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 mt-auto">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(article.category)}
                          <span className="capitalize text-xs">
                            {article.category.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{article.readTime} min</span>
                          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </ProfessionalCard>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">🎥 Video Tutorials</h2>
              <p className="text-muted-foreground">Learn with step-by-step visual guides</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  id: 'getting-started-video',
                  title: 'Getting Started with Aero HR',
                  description: 'Complete walkthrough of setting up your first payroll system',
                  duration: '12:34',
                  category: 'Getting Started',
                  thumbnail: '/api/placeholder/400/225',
                  views: '2.3k'
                },
                {
                  id: 'employee-setup-video',
                  title: 'Employee Management Basics',
                  description: 'How to add employees and configure their salary components',
                  duration: '8:45',
                  category: 'Employees',
                  thumbnail: '/api/placeholder/400/225',
                  views: '1.8k'
                },
                {
                  id: 'payroll-process-video',
                  title: 'Monthly Payroll Processing',
                  description: 'Complete guide to calculating and finalizing monthly payroll',
                  duration: '15:20',
                  category: 'Payroll',
                  thumbnail: '/api/placeholder/400/225',
                  views: '3.1k',
                  popular: true
                },
                {
                  id: 'compliance-video',
                  title: 'Indonesian Tax & BPJS Compliance',
                  description: 'Understanding PPh 21 calculations and BPJS enrollment',
                  duration: '18:30',
                  category: 'Compliance',
                  thumbnail: '/api/placeholder/400/225',
                  views: '1.5k'
                },
                {
                  id: 'reporting-video',
                  title: 'Reports and Analytics',
                  description: 'Generate comprehensive payroll and compliance reports',
                  duration: '10:15',
                  category: 'Advanced',
                  thumbnail: '/api/placeholder/400/225',
                  views: '890'
                },
                {
                  id: 'bulk-operations-video',
                  title: 'Bulk Operations Masterclass',
                  description: 'Efficiently manage large-scale salary adjustments',
                  duration: '13:45',
                  category: 'Advanced',
                  thumbnail: '/api/placeholder/400/225',
                  views: '1.2k'
                }
              ].map(video => (
                <ProfessionalCard key={video.id} variant="interactive" className="group overflow-hidden">
                  <div className="relative">
                    <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <Play className="h-12 w-12 text-white bg-red-500 rounded-full p-3 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                    {video.popular && (
                      <Badge className="absolute top-2 left-2 bg-red-500">
                        🔥 Popular
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base group-hover:text-primary transition-colors leading-tight">
                      {video.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {video.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Video className="h-3 w-3" />
                        <span className="text-xs">{video.category}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs">{video.views} views</span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </ProfessionalCard>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="faqs" className="space-y-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">❓ Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Quick answers to common questions</p>
            </div>
            
            {filteredFAQs.length === 0 ? (
              <ProfessionalCard className="text-center py-12">
                <CardContent>
                  <div className="max-w-md mx-auto">
                    <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                      <HelpCircle className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No FAQs found</h3>
                    <p className="text-muted-foreground mb-4">
                      We couldn't find any FAQs matching your search.
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Clear search
                    </Button>
                  </div>
                </CardContent>
              </ProfessionalCard>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map((faq, index) => (
                  <ProfessionalCard key={faq.id} variant="outlined" className="group">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                            <HelpCircle className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg font-medium leading-tight group-hover:text-primary transition-colors">
                              {faq.question}
                            </CardTitle>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {faq.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground font-mono bg-gray-100 rounded px-2 py-1">
                          #{String(index + 1).padStart(2, '0')}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="pl-11">
                        <p className="text-gray-700 leading-relaxed mb-6">{faq.answer}</p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <span className="text-sm text-muted-foreground font-medium">Was this helpful?</span>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="h-8">
                              <span className="mr-1">👍</span>
                              Yes
                            </Button>
                            <Button variant="outline" size="sm" className="h-8">
                              <span className="mr-1">👎</span>
                              No
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </ProfessionalCard>
                ))}
              </div>
            )}
            
            {/* FAQ Categories */}
            <ProfessionalCard className="mt-8">
              <CardHeader>
                <CardTitle className="text-center">Browse by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap justify-center gap-2">
                  {Array.from(new Set(faqItems.map(faq => faq.category))).map(category => {
                    const categoryCount = faqItems.filter(faq => faq.category === category).length
                    return (
                      <Button
                        key={category}
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery(category.toLowerCase())}
                        className="flex items-center space-x-2"
                      >
                        <span>{category}</span>
                        <Badge variant="secondary" className="text-xs">
                          {categoryCount}
                        </Badge>
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">💬 Contact Support</h2>
              <p className="text-muted-foreground">Get help from our expert support team</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <ProfessionalCard variant="elevated" className="group">
                <CardHeader className="text-center">
                  <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <Mail className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Email Support</CardTitle>
                  <CardDescription className="text-base">
                    Get detailed help via email with comprehensive solutions
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <span>Response time: Within 24 hours</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Expert HR consultants available</span>
                    </div>
                  </div>
                  <ActionButton variant="primary" className="w-full h-12">
                    <Mail className="mr-2 h-5 w-5" />
                    support@aero-hr.com
                  </ActionButton>
                </CardContent>
              </ProfessionalCard>

              <ProfessionalCard variant="elevated" className="group">
                <CardHeader className="text-center">
                  <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <MessageCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Live Chat</CardTitle>
                  <CardDescription className="text-base">
                    Instant help with our real-time chat support
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <span>Available: Mon-Fri, 9 AM - 6 PM WIB</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-green-600 font-medium">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Currently online</span>
                    </div>
                  </div>
                  <ActionButton variant="primary" className="w-full h-12">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Start Live Chat
                  </ActionButton>
                </CardContent>
              </ProfessionalCard>
            </div>

            {/* Contact Options */}
            <div className="grid gap-4 md:grid-cols-3">
              <ProfessionalCard variant="interactive" className="text-center group">
                <CardContent className="p-6">
                  <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                    <Phone className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Phone Support</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Call us for urgent issues
                  </p>
                  <p className="font-mono text-sm">+62 21 5555 0123</p>
                </CardContent>
              </ProfessionalCard>

              <ProfessionalCard variant="interactive" className="text-center group">
                <CardContent className="p-6">
                  <div className="p-3 bg-orange-100 rounded-full w-fit mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
                    <Book className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Knowledge Base</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Self-service help center
                  </p>
                  <p className="text-sm text-primary font-medium">Browse articles</p>
                </CardContent>
              </ProfessionalCard>

              <ProfessionalCard variant="interactive" className="text-center group">
                <CardContent className="p-6">
                  <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Community</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Connect with other users
                  </p>
                  <p className="text-sm text-primary font-medium">Join forum</p>
                </CardContent>
              </ProfessionalCard>
            </div>

            {/* Additional Resources */}
            <ProfessionalCard>
              <CardHeader>
                <CardTitle className="text-center">📚 Additional Resources</CardTitle>
                <CardDescription className="text-center">
                  Everything you need to master Aero HR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Download className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Indonesian Payroll Guide</h4>
                      <p className="text-sm text-muted-foreground">Complete compliance handbook (PDF)</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                      <Video className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Video Tutorial Library</h4>
                      <p className="text-sm text-muted-foreground">Step-by-step visual guides</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Watch
                    </Button>
                  </div>

                  <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">API Documentation</h4>
                      <p className="text-sm text-muted-foreground">Developer integration guide</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Docs
                    </Button>
                  </div>

                  <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <Keyboard className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Keyboard Shortcuts</h4>
                      <p className="text-sm text-muted-foreground">Work faster with hotkeys</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      View All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </ProfessionalCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}