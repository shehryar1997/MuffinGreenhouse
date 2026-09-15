"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqs = [
  { question: "Where are you located?", answer: "We are based in Clifton, Karachi. You can visit our nursery by appointment or order online for delivery across Karachi." },
  { question: "How do I know which plant is right for my space?", answer: "Take our Plant Finder quiz at /plant-finder or use the filters on our shop page. Consider light, space, and how much you can realistically water." },
  { question: "Do you deliver outside Karachi?", answer: "Currently we only deliver within Karachi city limits. For special requests outside Karachi, please WhatsApp us." },
  { question: "What if my plant dies?", answer: "We offer 30-day health guarantee on all plants. If something goes wrong, contact us with photos and we will help troubleshoot or replace." },
  { question: "How do I pay?", answer: "We accept credit cards (online), bank transfer, JazzCash, and Easypaisa. For manual payments, we will send you details after checkout." },
  { question: "Can I pick up my order?", answer: "Yes! Select 'Pickup' at checkout. We offer pickup from our Clifton location. You'll get the address after confirming your order." },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="bg-cream-100 min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-forest-500 mb-2">Help</p>
          <h1 className="font-serif text-heading-1 text-forest-900">Frequently Asked Questions</h1>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-forest-200 rounded-xl overflow-hidden bg-white">
              <button
                className="w-full flex items-center justify-between p-6 text-left cursor-pointer hover:bg-forest-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
                id={`faq-question-${index}`}
              >
                <span className="font-medium text-forest-900">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-forest-500 transition-transform ${openIndex === index ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {openIndex === index && (
                <motion.div 
                  initial={{ height: 0 }} 
                  animate={{ height: "auto" }} 
                  className="px-6 pb-6"
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                >
                  <p className="text-forest-600">{faq.answer}</p>
                </motion.div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-forest-600">Still have questions?</p>
          <a href="https://wa.me/923001234567" className="text-clay-500 hover:underline font-medium">WhatsApp us</a>
        </div>
      </div>
    </div>
  )
}
