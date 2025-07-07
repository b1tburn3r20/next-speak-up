import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import BugReportForm from "../1Components/components/BugReporting/BugReportForm";
import FeatureReportForm from "../1Components/components/FeatureSuggestion/FeatureSuggestionForm";

const PageFooter = () => {
  return (
    <footer className="mt-8 border-t">
      <div className="container mx-auto px-4">
        <Accordion type="single" collapsible>
          <AccordionItem value="show-footer">
            <AccordionTrigger className="text-sm text-muted-foreground font-thin w-full flex justify-center">
              Show Footer &nbsp;
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
                <div>
                  <h3 className="font-medium mb-2">Useful Links</h3>
                  <ul className="text-sm space-y-2">
                    <li>
                      <a href="#" className="hover:underline">
                        Home
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:underline">
                        About Us
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:underline">
                        Services
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:underline">
                        Blog
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:underline">
                        FAQ
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Contact Us</h3>
                  <ul className="text-sm space-y-2">
                    <li>
                      <span className="font-medium">Email:</span>
                      <a
                        href="mailto:info@example.com"
                        className="hover:underline ml-1"
                      >
                        info@example.com
                      </a>
                    </li>
                    <li>
                      <span className="font-medium">Phone:</span>
                      <a
                        href="tel:+1234567890"
                        className="hover:underline ml-1"
                      >
                        (123) 456-7890
                      </a>
                    </li>
                    <li>
                      <span className="font-medium">Address:</span>
                      <p className="mt-1">
                        123 Business Street
                        <br />
                        City, State 12345
                      </p>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Legal</h3>
                  <ul className="text-sm space-y-2">
                    <li>
                      <a href="#" className="hover:underline">
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:underline">
                        Terms of Service
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:underline">
                        Cookie Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:underline">
                        GDPR
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-6">
                <div className="flex justify-center space-x-6">
                  <a href="#" className="hover:text-gray-600">
                    Twitter
                  </a>
                  <a href="#" className="hover:text-gray-600">
                    Facebook
                  </a>
                  <a href="#" className="hover:text-gray-600">
                    LinkedIn
                  </a>
                  <a href="#" className="hover:text-gray-600">
                    Instagram
                  </a>
                </div>
              </div>
              <div className="text-center text-sm mt-6">
                © {new Date().getFullYear()} Your Company. All rights reserved.
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <BugReportForm />
      <FeatureReportForm />
    </footer>
  );
};

export default PageFooter;
