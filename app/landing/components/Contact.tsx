import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send } from "lucide-react";
import Link from "next/link";

const Contact = () => {
  const ContactForm = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              First Name
            </Label>
            <Input id="firstName" placeholder="Sarah" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Last Name
            </Label>
            <Input id="lastName" placeholder="Smith" className="h-11" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Your Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@gmail.com"
              className="h-11"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label
              htmlFor="phone"
              className="text-sm font-medium text-muted-foreground"
            >
              Phone Number (optional)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (123) 456-7891"
              className="h-11"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Your Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              className="min-h-[120px] resize-none"
              placeholder="Tell us how we can help you..."
              required
            />
          </div>
        </div>

        <Button size="lg" className="w-full sm:w-auto">
          Send Message
          <Send className="ml-2 h-4 w-4" />
        </Button>

        <div className="text-xs text-muted-foreground leading-relaxed pt-2 border-t">
          <p>
            Any information you supply to us in the form above is confidential
            and{" "}
            <span className="text-primary font-medium">
              under no circumstances
            </span>{" "}
            will be disclosed to third parties. To learn more about how we
            safeguard your data,{" "}
            <Link
              className="text-primary underline hover:text-primary/80 transition-colors"
              href="/privacy"
            >
              see our privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    );
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className="font-bold text-3xl sm:text-4xl lg:text-5xl mb-4 sm:mb-6">
            Get in Touch
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            We'd love to hear from you. Send us a message and we'll respond as
            soon as possible.
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-card border rounded-xl p-6 sm:p-8 shadow-sm">
              <ContactForm />
            </div>
          </div>

          {/* Contact Info */}
          <div className="order-1 lg:order-2">
            <div className="bg-muted/30 rounded-xl p-6 sm:p-8 text-center h-full flex flex-col justify-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-xl">Support Email</h3>
                <p className="text-muted-foreground text-sm">
                  We typically respond within 24 hours
                </p>
              </div>

              <Link
                href="mailto:info@coolbills.com"
                className="text-primary hover:text-primary/80 transition-colors font-medium text-lg"
              >
                info@coolbills.com
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
