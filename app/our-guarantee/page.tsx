import { Check, X, MessageCircle, Shield, AlertCircle } from "lucide-react"

export default function GuaranteePage() {
  return (
    <div className="bg-cream-100 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-forest-500 mb-2">Promise</p>
          <h1 className="font-serif text-display text-forest-900 mb-4">Our Guarantee</h1>
          <p className="text-forest-600">Fair to you. Fair to us. Transparent for everyone.</p>
        </div>

        {/* Plant Health Guarantee Section */}
        <div
          className="bg-gradient-to-br from-clay-500/10 to-clay-500/5 border border-clay-500/20 rounded-2xl p-8 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-clay-500" />
            <h2 className="font-serif text-heading-2 text-forest-900">Plant Health Guarantee</h2>
          </div>
          <p className="text-forest-700 leading-relaxed mb-4">
            We stand behind every plant we ship. If your plant arrives dead or severely damaged, 
            we have got you covered. Just share clear photos within <strong>2 hours</strong> of delivery 
            so we can assess and make it right.
          </p>
          <ul className="text-forest-700 text-sm space-y-2 mb-6">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-sprout-300 mt-0.5 shrink-0" />
              <span>2-hour window from delivery timestamp</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-sprout-300 mt-0.5 shrink-0" />
              <span>Clear photos of the plant + packaging required</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-sprout-300 mt-0.5 shrink-0" />
              <span>Replacement or store credit (your choice)</span>
            </li>
          </ul>
          <a
            href="https://wa.me/923001234567"
            target="_blank"
            className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp for Claims
          </a>
        </div>

        {/* What's Not Covered */}
        <div
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-serif text-lg text-forest-900 mb-2">The Root Check Rule</h3>
              <p className="text-forest-700 text-sm leading-relaxed">
                If roots are white/tan and firm (healthy) but leaves decline after arrival, 
                that is <strong>acclimation stress</strong>, not transit damage. We will not replace it, 
                but we will guide you through recovery — free plant doctor consultation included.
              </p>
            </div>
          </div>
        </div>

        {/* Coverage Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-forest-200/50">
            <h3 className="font-serif text-lg text-forest-900 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-sprout-300" />
              We Cover
            </h3>
            <ul className="space-y-2 text-forest-700 text-sm">
              <li>• Broken/cracked stems from transit</li>
              <li>• Root rot (black/brown mushy roots)</li>
              <li>• Major pest infestation present at arrival</li>
              <li>• Wrong plant shipped</li>
              <li>• Severe leaf damage (&gt;50% of foliage)</li>
              <li>• Plant arrived dead or dying</li>
            </ul>
          </div>

          <div className="bg-cream-200 rounded-2xl p-6">
            <h3 className="font-serif text-lg text-forest-900 mb-4 flex items-center gap-2">
              <X className="w-5 h-5 text-clay-500" />
              We Do Not Cover
            </h3>
            <ul className="space-y-2 text-forest-700 text-sm">
              <li>• Minor leaf damage (they recover)</li>
              <li>• 1-2 yellow leaves on older plants</li>
              <li>• Soil spillage during transit</li>
              <li>• Decline after acclimation period</li>
              <li>• Plants kept in unsuitable conditions</li>
              <li>• Claims past the 2-hour timeframe</li>
            </ul>
          </div>
        </div>

        {/* Quick Reference */}
        <div
          className="bg-forest-300 text-cream-100 rounded-2xl p-8 text-center"
        >
          <h3 className="font-serif text-xl mb-4">Quick Reference</h3>
          <div className="max-w-sm mx-auto">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="font-semibold mb-1">All Plants</div>
              <div>2 hours • Clear photos required • Replacement or store credit</div>
            </div>
          </div>
        </div>

        <p className="text-center text-forest-500 mt-8">
          We package with care. You care for plants. We both win.
        </p>
      </div>
    </div>
  )
}
