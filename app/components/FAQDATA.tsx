"use client";

import React from "react";
import FAQSection, { FAQ } from "../components/ui/FAQ";

const faqs: FAQ[] = [
  {
    q: "What is The Golf Exchange?",
    a: "The Golf Exchange is an online platform for golfers to buy, sell, and trade golf equipment easily.",
  },
  {
    q: "Do you offer international shipping?",
    a: "Yes, we ship worldwide to make premium golf gear accessible to everyone.",
  },
  {
    q: "Free Shipping on Orders Above $3,220.84?",
    a: "Yes, we offer free shipping on orders above $3,220.84 to provide added value to our customers.",
  },
  {
    q: "Can I list my used golf clubs?",
    a: "Absolutely! You can list used golf gear, clubs, or accessories for sale in just a few clicks.",
  },
  {
    q: "Is it free to create an account?",
    a: "Yes, creating an account on The Golf Exchange is completely free. You can start browsing or listing right away.",
  },
  {
    q: "How do I know if a product is authentic?",
    a: "All sellers go through a verification process, and we encourage buyers to review seller ratings and product photos carefully before purchase.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We support all major credit cards, debit cards, PayPal, and select regional payment options for a smooth checkout experience.",
  },
  {
    q: "Can I return an item after purchase?",
    a: "Yes, items can be returned within 7 days of delivery if they don’t match the description or arrive damaged, provided they meet our return policy conditions.",
  },
  {
    q: "How long does shipping take?",
    a: "Shipping time varies based on the seller’s location, but most orders arrive within 5–10 business days domestically and 10–20 days internationally.",
  },
  {
    q: "Do you provide seller protection?",
    a: "Yes, sellers are protected through our secure payment system and dispute resolution process to ensure fair and safe transactions.",
  },
  {
    q: "Can I track my order?",
    a: "Definitely! Once your order ships, you’ll receive a tracking number that lets you monitor delivery progress in real time.",
  },
  {
    q: "Do you offer promotions or discounts?",
    a: "Yes, we regularly feature seasonal sales, referral rewards, and member-only discounts. Subscribe to our newsletter to stay updated.",
  },
  {
    q: "Is my personal information safe?",
    a: "We take data privacy seriously. All transactions are encrypted, and your personal information is never shared with third parties.",
  },
  {
    q: "Can businesses or brands partner with The Golf Exchange?",
    a: "Yes, we welcome partnerships with golf retailers, brands, and instructors. Contact our partnership team for more details.",
  },
  {
    q: "Do you sell golf apparel and accessories too?",
    a: "Yes! You’ll find a wide range of golf clothing, shoes, gloves, and training accessories from top brands and trusted sellers.",
  },
  {
    q: "How can I contact customer support?",
    a: "You can reach our support team anytime via email or live chat for assistance with orders, listings, or technical issues.",
  },
  {
    q: "What if I have more questions?",
    a: "If you have additional questions, feel free to reach out to our support team or check our Help Center for more information.",
  },
  {
    q: "Can I save my favorite items?",
    a: "Yes, you can create a wishlist by saving items to your favorites for easy access later.",
  },
  {
    q: "Are there any fees for selling items?",
    a: "We charge a small commission fee on successful sales to help maintain and improve our platform.",
  },

  {
    q: "How do I leave a review for a seller?",
    a: "After completing a purchase, you can leave feedback and rate the seller based on your experience.",
  },
];

export default function FAQWrapper() {
  return <FAQSection faqs={faqs} />;
}
