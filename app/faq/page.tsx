import FAQAccordion from "./faq-accordion"

export default function FAQPage() {
  return (
    <div className="bg-cream-100 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-forest-500 mb-2">Help</p>
          <h1 className="font-serif text-heading-1 text-forest-900">Frequently Asked Questions</h1>
        </div>

        <FAQAccordion />

        <div className="mt-12 text-center">
          <p className="text-forest-600">Still have questions?</p>
          <a href="https://wa.me/923001234567" className="text-clay-500 hover:underline font-medium">WhatsApp us</a>
        </div>
      </div>
    </div>
  )
}
