"use client"

import { useState, useEffect } from "react"
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
  Phone
} from "lucide-react"
import { cn } from "@/lib/utils"

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
    id: 'getting-started-overview',
    title: 'Getting Started with Aero HR',
    description: 'Learn the basics of using Aero HR for Indonesian payroll management',
    category: 'getting-started',
    type: 'tutorial',
    readTime: 10,
    popular: true
  },
  {
    id: 'add-employee',
    title: 'Adding New Employees',
    description: 'Step-by-step guide to adding employees to the system',
    category: 'employees',
    type: 'article',
    readTime: 5,
    popular: true
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
    id: 'payroll-calculation',
    title: 'Running Payroll Calculations',
    description: 'How to calculate and process monthly payroll',
    category: 'payroll',
    type: 'article',
    readTime: 12
  },
  {
    id: 'pph21-setup',
    title: 'PPh 21 Tax Configuration',
    description: 'Setting up Indonesian income tax calculations',
    category: 'compliance',
    type: 'tutorial',
    readTime: 15
  },
  {
    id: 'bpjs-enrollment',
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
    id: 'export-reports',
    title: 'Exporting Compliance Reports',
    description: 'Generate and export reports for government compliance',
    category: 'compliance',
    type: 'video',
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
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredArticles, setFilteredArticles] = useState(helpArticles)
  const [filteredFAQs, setFilteredFAQs] = useState(faqItems)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get help with Aero HR, learn about Indonesian payroll compliance, and discover advanced features
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search help articles, guides, and FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-center"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <Dialog>
          <DialogTrigger asChild>
            <ActionButton variant="secondary" className="h-20 flex flex-col">
              <Keyboard className="h-6 w-6 mb-2" />
              <span className="text-sm">Keyboard Shortcuts</span>
            </ActionButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
              <DialogDescription>Use keyboard shortcuts to navigate faster</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Go to Dashboard</span>
                    <Badge variant="outline" className="font-mono">G + D</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Go to Employees</span>
                    <Badge variant="outline" className="font-mono">G + E</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Search</span>
                    <Badge variant="outline" className="font-mono">/</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Create Employee</span>
                    <Badge variant="outline" className="font-mono">C + E</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Show Help</span>
                    <Badge variant="outline" className="font-mono">?</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Close Modal</span>
                    <Badge variant="outline" className="font-mono">Esc</Badge>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <ActionButton variant="secondary" className="h-20 flex flex-col">
          <MessageCircle className="h-6 w-6 mb-2" />
          <span className="text-sm">Contact Support</span>
        </ActionButton>

        <ActionButton variant="secondary" className="h-20 flex flex-col">
          <Download className="h-6 w-6 mb-2" />
          <span className="text-sm">Download Guide</span>
        </ActionButton>

        <ActionButton variant="secondary" className="h-20 flex flex-col">
          <ExternalLink className="h-6 w-6 mb-2" />
          <span className="text-sm">Video Tutorials</span>
        </ActionButton>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-6">
          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center space-x-1"
              >
                <category.icon className="h-3 w-3" />
                <span>{category.label}</span>
              </Button>
            ))}
          </div>

          {/* Popular Articles */}
          {selectedCategory === 'all' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Popular Articles</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {helpArticles.filter(article => article.popular).map(article => (
                  <ProfessionalCard key={article.id} variant="interactive">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(article.type)}
                          <CardTitle className="text-base">{article.title}</CardTitle>
                        </div>
                        <Badge variant="secondary">Popular</Badge>
                      </div>
                      <CardDescription>{article.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(article.category)}
                          <span className="capitalize">{article.category.replace('-', ' ')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>{article.readTime} min read</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </CardContent>
                  </ProfessionalCard>
                ))}
              </div>
            </div>
          )}

          {/* All Articles */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {selectedCategory === 'all' ? 'All Articles' : `${categories.find(c => c.id === selectedCategory)?.label} Articles`}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map(article => (
                <ProfessionalCard key={article.id} variant="interactive">
                  <CardHeader>
                    <div className="flex items-center space-x-2 mb-2">
                      {getTypeIcon(article.type)}
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {article.type}
                      </span>
                    </div>
                    <CardTitle className="text-base">{article.title}</CardTitle>
                    <CardDescription>{article.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        {getCategoryIcon(article.category)}
                        <span>{article.readTime} min</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </ProfessionalCard>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="faqs" className="space-y-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              {filteredFAQs.map(faq => (
                <ProfessionalCard key={faq.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base font-medium">{faq.question}</CardTitle>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {faq.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <span className="text-sm text-muted-foreground">Was this helpful?</span>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">👍 Yes</Button>
                        <Button variant="outline" size="sm">👎 No</Button>
                      </div>
                    </div>
                  </CardContent>
                </ProfessionalCard>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-6 text-center">Contact Support</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              <ProfessionalCard>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span>Email Support</span>
                  </CardTitle>
                  <CardDescription>
                    Get detailed help via email
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Response time: Within 24 hours
                  </p>
                  <ActionButton variant="primary" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    support@aero-hr.com
                  </ActionButton>
                </CardContent>
              </ProfessionalCard>

              <ProfessionalCard>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <span>Live Chat</span>
                  </CardTitle>
                  <CardDescription>
                    Chat with our support team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Available: Mon-Fri, 9 AM - 6 PM WIB
                  </p>
                  <ActionButton variant="primary" className="w-full">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Start Chat
                  </ActionButton>
                </CardContent>
              </ProfessionalCard>
            </div>

            <ProfessionalCard>
              <CardHeader>
                <CardTitle>Additional Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <Download className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">Indonesian Payroll Guide</p>
                        <p className="text-sm text-muted-foreground">Complete guide to Indonesian payroll compliance</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Download</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <Video className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">Video Tutorial Library</p>
                        <p className="text-sm text-muted-foreground">Step-by-step video guides</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Watch
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