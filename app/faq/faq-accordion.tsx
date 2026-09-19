"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqs = [
  { question: "Where are you located?", answer: "We are based in Karachi and deliver across Pakistan. If you'd like to pick up your order or visit, message us on WhatsApp and we'll share the address and arrange a time." },
  { question: "Where do your plants come from?", answer: "We source our plants from growers around the world, and we also propagate many of them ourselves here in Karachi." },
  { question: "How do I know which plant is right for my space?", answer: "Take our Plant Finder quiz at /plant-finder or use the filters on our shop page. Consider light, space, and how much you can realistically water." },
  { question: "Do you deliver outside Karachi?", answer: "Yes, we deliver across Pakistan. Karachi orders are delivered by us at a flat rate, and other cities are shipped by courier (Leopards). The exact fee is calculated at checkout from your location." },
  { question: "What if my plant arrives damaged?", answer: "Send clear photos of the plant and its packaging on WhatsApp within 2 hours of receiving your package, along with your order number. Once we approve the claim, return the plant to us and choose a replacement or store credit. Read more on /our-guarantee." },
  { question: "Why only 2 hours?", answer: "Transit damage shows up quickly, and a short window lets us tell it apart from problems that come from a new spot or new care routine. It also keeps things fair for everyone, so please check your plant as soon as it arrives." },
  { question: "Do you offer refunds?", answer: "Approved claims are settled with a replacement or store credit rather than cash. Orders that aren't paid within 24 hours are cancelled automatically, and you can simply place them again." },
  { question: "How do I pay?", answer: "We accept bank transfer (HBL), JazzCash and Easypaisa. The account details are shown right after checkout, and you share your payment receipt with us on WhatsApp. We hold your order for 24 hours while you pay." },
  { question: "Can I pick up my order?", answer: "Yes! Select 'Pickup' at checkout, then message us on WhatsApp. We'll share the pickup address and agree a time with you." },
]

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div key={index} className="border border-forest-200 rounded-xl overflow-hidden bg-surface">
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
  )
}
