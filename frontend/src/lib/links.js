export const POLICY_LINKS = [
    { slug: 'cancellation-policy', title: 'Cancellation Policy' },
    { slug: 'return-policy', title: 'Return Policy' },
    { slug: 'privacy-policy', title: 'Privacy Policy' },
    { slug: 'terms-and-conditions', title: 'Terms & Conditions' },
    { slug: 'shipping-policy', title: 'Shipping Policy' },
    { slug: 'disclaimer', title: 'Disclaimer' },
];

// The order here is the order shown in the footer.
export const FOOTER_LINKS = [
    { label: 'Blogs', href: '/blogs' },
    { label: 'Search', href: '/products' },
    { label: 'Contact Us', href: '/contact' },
    ...POLICY_LINKS.map((p) => ({ label: p.title, href: `/policies/${p.slug}` })),
];