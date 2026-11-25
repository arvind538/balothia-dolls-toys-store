import { SITE } from '@/lib/siteInfo';
import { POLICY_LINKS } from '@/lib/links';

const money = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const reach = `${SITE.email} or call ${SITE.phone} (${SITE.hours})`;
const go = SITE.grievanceOfficer;

const CONTENT = {
    /* ---------------------------------------------------------------- */
    'cancellation-policy': {
        summary: 'When you can cancel an order, and what happens to your payment.',
        intro: `We understand that plans can change. This policy explains when you can cancel an order placed with ${SITE.name}, and how refunds work.`,
        sections: [
            {
                title: 'Cancelling before your order ships',
                blocks: [
                    { p: `You can cancel an order free of charge at any time before it is shipped. Orders are normally packed within ${SITE.dispatchTime}, so please contact us as early as possible.` },
                    { p: `To cancel, write to ${reach} and share:` },
                    { ul: ['Your order ID (for example, #A1B2C3)', 'The name and mobile number used on the order', 'The reason for cancellation (optional, but it helps us improve)'] },
                    { p: 'We will confirm the cancellation by email or phone, and the status of your order will change to "Cancelled" in My Orders.' },
                ],
            },
            {
                title: 'Cancelling after your order has shipped',
                blocks: [
                    { p: `Once an order has been handed to the courier, it cannot be cancelled. When the parcel arrives you can still return it under our Return Policy, which allows requests within ${SITE.returnDays} days of delivery.` },
                ],
            },
            {
                title: 'Refunds for cancelled orders',
                blocks: [
                    {
                        ul: [
                            `Online payments (UPI, cards, net banking, wallets): the full amount is refunded to the original payment method within ${SITE.refundTime}.`,
                            'Cash on Delivery: nothing has been paid, so there is nothing to refund.',
                        ]
                    },
                    { p: 'Your bank or payment provider may take a few extra days to show the refund in your account.' },
                ],
            },
            {
                title: 'When we may cancel an order',
                blocks: [
                    { p: 'In some situations we may need to cancel an order. For example:' },
                    {
                        ul: [
                            'The product is out of stock or has been discontinued.',
                            'There is an error in the price or product details.',
                            'The delivery address is not serviceable by our courier partners.',
                            'The payment failed, or we suspect fraudulent activity.',
                            'We are unable to reach you to confirm the order details.',
                        ]
                    },
                    { p: 'If we cancel your order, we will let you know and refund any amount you have paid in full.' },
                ],
            },
            {
                title: 'Cash on Delivery orders',
                blocks: [
                    { p: 'Please accept Cash on Delivery orders that you have placed. If orders are repeatedly refused or left unattended at delivery, we may disable Cash on Delivery for your account.' },
                ],
            },
        ],
    },

    /* ---------------------------------------------------------------- */
    'return-policy': {
        summary: 'How to return or replace a toy or doll, and how refunds are processed.',
        intro: `We want you and your child to love every toy and doll. If something is not right, this policy explains how to return it or get a replacement.`,
        sections: [
            {
                title: 'Return window',
                blocks: [
                    { p: `You can request a return within ${SITE.returnDays} days of delivery. We are unable to accept return requests after this period.` },
                ],
            },
            {
                title: 'When you can return a product',
                blocks: [
                    {
                        ul: [
                            'You received the wrong product.',
                            'The product arrived damaged or defective.',
                            'Parts or accessories are missing from the pack.',
                            'An electronic or battery-operated toy does not work when used as described in its instructions.',
                            'Change of mind: the product is unused and unopened, in its original sealed packaging with all tags, accessories and the invoice.',
                        ]
                    },
                ],
            },
            {
                title: 'Products that cannot be returned',
                blocks: [
                    {
                        ul: [
                            'Opened or used hygiene items, such as teethers, feeding items and baby care products.',
                            'Dolls or toys that have been washed, painted, or had their hair, clothes or parts cut, dyed or altered.',
                            'Products damaged through misuse, drops, water damage or the use of incorrect batteries or chargers.',
                            'Products returned without the original packaging, accessories or tags.',
                            'Clearance or special-offer items that are marked as non-returnable on the product page.',
                        ]
                    },
                ],
            },
            {
                title: 'How to return a product',
                blocks: [
                    {
                        ol: [
                            `Contact us at ${reach} within ${SITE.returnDays} days of delivery. Share your order ID, the product name and the reason for the return.`,
                            'If the product is damaged, defective or incorrect, please attach clear photos or an unboxing video.',
                            'We will review your request within 1 to 2 business days and send you the next steps.',
                            'Pack the product securely with its original packaging, accessories and invoice.',
                            'We will arrange a pickup where it is available. Otherwise, you can ship the parcel to the address we share with you.',
                        ]
                    },
                ],
            },
            {
                title: 'Inspection and refunds',
                blocks: [
                    { p: `When we receive the product, we inspect it and confirm the outcome by email or phone. Approved refunds are processed within ${SITE.refundTime}.` },
                    {
                        table: {
                            head: ['Payment method', 'How we refund', 'Time'],
                            rows: [
                                ['Online payment (UPI, card, net banking, wallet)', 'To the original payment method', SITE.refundTime],
                                ['Cash on Delivery', 'Bank transfer or UPI (we will ask for your details)', SITE.refundTime],
                            ],
                        }
                    },
                    { p: 'Your bank or payment provider may take a few extra days to show the refund in your account.' },
                ],
            },
            {
                title: 'Replacements',
                blocks: [
                    { p: 'If a product is damaged or defective and the item is in stock, we can send a replacement instead of a refund. If it is not in stock, we will refund the full amount.' },
                ],
            },
            {
                title: 'Return shipping costs',
                blocks: [
                    {
                        ul: [
                            'Wrong, damaged or defective products: return shipping is free.',
                            'Change of mind: the return shipping cost is paid by the customer, and the original shipping fee is non-refundable.',
                        ]
                    },
                ],
            },
            {
                title: 'Damaged in transit',
                blocks: [
                    { p: 'We recommend recording a short video while opening the parcel. Please report any transit damage within 48 hours of delivery so we can resolve it quickly with the courier.' },
                ],
            },
        ],
    },

    /* ---------------------------------------------------------------- */
    'privacy-policy': {
        summary: 'What personal information we collect, how we use it, and your rights.',
        intro: `${SITE.name} ("we", "us") respects your privacy. This policy explains what personal information we collect when you use our website, how we use it, and the choices you have. It is written in line with the Digital Personal Data Protection Act, 2023 of India.`,
        sections: [
            {
                title: 'Information we collect',
                blocks: [
                    {
                        ul: [
                            'Account details: your name, email address, mobile number and password. Your password is stored in a hashed form, so we cannot read it.',
                            'Order details: the products you buy, your delivery address and the status of your payment.',
                            'Wishlist and cart: the products you save or add to your cart.',
                            'Messages: the details you send us through the contact form, email or phone.',
                            'Technical data: basic information such as your browser, device and IP address, used for security and to keep the website working.',
                        ]
                    },
                ],
            },
            {
                title: 'Payment information',
                blocks: [
                    { p: 'Online payments are processed securely by our payment partner, Razorpay. We never see or store your card number, UPI PIN or net banking credentials. We only receive confirmation of whether the payment was successful.' },
                ],
            },
            {
                title: 'How we use your information',
                blocks: [
                    {
                        ul: [
                            'To create and manage your account.',
                            'To process, deliver and support your orders, returns and refunds.',
                            'To send important messages, such as order updates and password reset codes.',
                            'To respond to your questions and complaints.',
                            'To prevent fraud and keep our website secure.',
                            'To improve our products, website and service.',
                        ]
                    },
                ],
            },
            {
                title: 'Who we share it with',
                blocks: [
                    { p: 'We share only what is necessary, and only with:' },
                    {
                        ul: [
                            'Courier and logistics partners, who need your name, address and phone number to deliver your order.',
                            'Our payment partner, to process your payment or refund.',
                            'Service providers who help us run the website, such as cloud hosting, database, image storage and email services. They are required to protect your data.',
                            'Government or legal authorities, when we are required to do so by law.',
                        ]
                    },
                    { p: 'We do not sell your personal information.' },
                ],
            },
            {
                title: 'Browser storage',
                blocks: [
                    { p: 'We use your browser\'s local storage to keep you signed in and to remember the items in your cart. We do not currently use advertising or third-party tracking cookies. You can clear this data from your browser settings at any time, but you will need to sign in again.' },
                ],
            },
            {
                title: 'How long we keep your information',
                blocks: [
                    { p: 'We keep your information for as long as your account is active and as needed for orders, accounting, tax and legal requirements, and to resolve disputes. After that, we delete or anonymise it.' },
                ],
            },
            {
                title: 'Security',
                blocks: [
                    { p: 'We protect your information with measures such as encrypted connections (HTTPS), hashed passwords and restricted access to our systems. No online service can be completely secure, so please keep your password confidential.' },
                ],
            },
            {
                title: 'Your rights',
                blocks: [
                    { p: 'You can ask us to:' },
                    {
                        ul: [
                            'Give you a summary of the personal data we hold about you.',
                            'Correct or update inaccurate information.',
                            'Delete your data, subject to any records we must keep by law.',
                            'Withdraw your consent to our processing of your data.',
                        ]
                    },
                    { p: `To make a request, write to ${SITE.email}. We will respond as soon as possible and within the time required by law.` },
                ],
            },
            {
                title: 'Children',
                blocks: [
                    { p: 'Our website is meant for parents and guardians who are 18 or older. We do not knowingly collect personal information from children. If you believe a child has created an account, please contact us and we will delete it.' },
                ],
            },
            {
                title: 'Changes to this policy',
                blocks: [
                    { p: `We may update this policy from time to time. The latest version is always available on this page, with the date it was last updated (${SITE.policiesUpdated}).` },
                ],
            },
            {
                title: 'Contact and grievance officer',
                blocks: [
                    { p: `For any privacy question or complaint, please contact our ${go.name} at ${go.email}. We acknowledge complaints within 48 hours and aim to resolve them within one month.` },
                ],
            },
        ],
    },

    /* ---------------------------------------------------------------- */
    'terms-and-conditions': {
        summary: 'The terms that apply when you browse and buy from our website.',
        intro: `Welcome to ${SITE.name}. By using this website or placing an order, you agree to these Terms & Conditions. Please read them carefully.`,
        sections: [
            {
                title: 'Eligibility and your account',
                blocks: [
                    {
                        ul: [
                            'You must be at least 18 years old and legally able to enter into a contract to place an order.',
                            'You must provide accurate and complete information when you register and when you order.',
                            'You are responsible for keeping your password confidential and for all activity under your account.',
                            'We may suspend or close accounts that are misused or that provide false information.',
                        ]
                    },
                ],
            },
            {
                title: 'Products and information',
                blocks: [
                    { p: 'We try to describe and display our products as accurately as possible. However, colours, finishes and packaging may vary slightly from the images shown. Product availability depends on stock. Please see our Disclaimer for important safety and age-grading information.' },
                ],
            },
            {
                title: 'Prices and payment',
                blocks: [
                    {
                        ul: [
                            'All prices are in Indian Rupees (INR) and include applicable GST, unless stated otherwise.',
                            'Shipping charges, if any, are shown at checkout before you pay.',
                            'We may correct pricing or listing errors. If this affects an order you have placed, we will contact you and you can choose to continue or cancel.',
                            'You can pay online through Razorpay (UPI, cards, net banking and wallets) or by Cash on Delivery, where available.',
                            'An online order is confirmed once the payment is verified. A Cash on Delivery order is confirmed when you place it.',
                        ]
                    },
                ],
            },
            {
                title: 'Cancellations, shipping and returns',
                blocks: [
                    { p: 'Our Cancellation Policy, Shipping Policy and Return Policy form part of these terms. Please read them before you order.' },
                ],
            },
            {
                title: 'Safe use of products',
                blocks: [
                    { p: 'Toys must be used according to the age grading and instructions on the packaging, and with adult supervision where needed. You are responsible for choosing products that are suitable for your child.' },
                ],
            },
            {
                title: 'Acceptable use',
                blocks: [
                    { p: 'You agree not to:' },
                    {
                        ul: [
                            'Use the website for any unlawful or fraudulent purpose.',
                            'Attempt to gain unauthorised access to our systems or other users\' accounts.',
                            'Copy, scrape or misuse our content, images or product data without permission.',
                            'Interfere with the normal working of the website.',
                        ]
                    },
                ],
            },
            {
                title: 'Intellectual property',
                blocks: [
                    { p: `The content of this website, including text, logos, design and images, belongs to ${SITE.name} or its licensors and is protected by law. Brand names and trademarks of third parties belong to their respective owners.` },
                ],
            },
            {
                title: 'Limitation of liability',
                blocks: [
                    { p: 'To the extent permitted by law, we are not liable for any indirect or consequential loss arising from the use of this website or our products. Our total liability for any claim is limited to the amount you paid for the product concerned. Nothing in these terms limits your rights as a consumer under Indian law.' },
                ],
            },
            {
                title: 'Governing law',
                blocks: [
                    { p: 'These terms are governed by the laws of India. Any dispute is subject to the exclusive jurisdiction of the courts at Jaipur, Rajasthan.' },
                ],
            },
            {
                title: 'Changes to these terms',
                blocks: [
                    { p: `We may update these terms from time to time. The latest version is always on this page (last updated ${SITE.policiesUpdated}). Continued use of the website means you accept the updated terms.` },
                ],
            },
            {
                title: 'Contact and grievance officer',
                blocks: [
                    { p: `For questions or complaints, please contact our ${go.name} at ${go.email}, or call ${SITE.phone} (${SITE.hours}). We acknowledge complaints within 48 hours and aim to resolve them within one month.` },
                ],
            },
        ],
    },

    /* ---------------------------------------------------------------- */
    'shipping-policy': {
        summary: 'Where we deliver, shipping charges, and how long delivery takes.',
        intro: `This policy explains how ${SITE.name} ships your toys and dolls, what it costs, and what to expect once you place an order.`,
        sections: [
            {
                title: 'Where we deliver',
                blocks: [
                    { p: 'We deliver across India to all PIN codes served by our courier partners. We do not ship internationally at the moment.' },
                ],
            },
            {
                title: 'Shipping charges',
                blocks: [
                    {
                        table: {
                            head: ['Order value', 'Shipping charge'],
                            rows: [
                                [`Below ${money(SITE.freeShippingAbove)}`, money(SITE.shippingFee)],
                                [`${money(SITE.freeShippingAbove)} and above`, 'Free'],
                            ],
                        }
                    },
                    { p: 'There is no extra fee for Cash on Delivery. The final shipping charge is always shown at checkout before you pay.' },
                ],
            },
            {
                title: 'Order processing time',
                blocks: [
                    { p: `Orders are usually packed and handed to the courier within ${SITE.dispatchTime} after they are confirmed. We dispatch from Monday to Saturday, except on public holidays.` },
                ],
            },
            {
                title: 'Estimated delivery time',
                blocks: [
                    {
                        table: {
                            head: ['Delivery location', 'After dispatch'],
                            rows: [
                                ['Jaipur and the rest of Rajasthan', '2 to 4 business days'],
                                ['Metro cities', '3 to 5 business days'],
                                ['Rest of India', '4 to 7 business days'],
                                ['Remote and hilly areas', '7 to 10 business days'],
                            ],
                        }
                    },
                    { p: 'These are estimates. Delivery may take longer because of weather, strikes, festivals or other events outside our control.' },
                ],
            },
            {
                title: 'Order status',
                blocks: [
                    { p: 'You can follow your order at any time in My Orders. The status changes to "Shipped" when your parcel leaves us, and to "Delivered" once it reaches you.' },
                ],
            },
            {
                title: 'Delivery address and attempts',
                blocks: [
                    {
                        ul: [
                            'Please enter a complete and correct address, PIN code and mobile number. Orders sent to incorrect addresses may be delayed or returned.',
                            'Our courier partners usually make up to three delivery attempts. If delivery is not possible, the parcel is returned to us.',
                            'For returned parcels, we will contact you to re-ship the order (extra shipping charges may apply) or to cancel it and refund your payment, less the shipping charges.',
                        ]
                    },
                ],
            },
            {
                title: 'Damaged or tampered parcels',
                blocks: [
                    { p: `If a parcel looks damaged or opened, please do not accept it, or note it on the courier's delivery slip. Contact us within 48 hours at ${reach}. See our Return Policy for the next steps.` },
                ],
            },
            {
                title: 'Orders with several items',
                blocks: [
                    { p: 'If you order several products together, they may be shipped in separate parcels and may arrive on different days. You will not be charged extra shipping for this.' },
                ],
            },
        ],
    },

    /* ---------------------------------------------------------------- */
    disclaimer: {
        summary: 'Important information about product images, age grading and safe use.',
        intro: `The information on ${SITE.name} is provided in good faith for general guidance. Please read the notes below, especially the safety information, before you buy or give a toy to a child.`,
        sections: [
            {
                title: 'Product images and descriptions',
                blocks: [
                    { p: 'Images are for illustration. The actual colours, finish, packaging, and the hair, outfits or accessories of dolls may differ slightly because of screen settings, lighting or production batches. Dimensions and weights are approximate.' },
                ],
            },
            {
                title: 'Age grading and choking hazards',
                blocks: [
                    {
                        ul: [
                            'The recommended age on a product is a guide. Please follow the age grading printed on the packaging.',
                            'Toys with small parts can be a choking hazard and are not suitable for children under 3 years.',
                            'Please check the packaging for age grading and safety marks, such as the BIS (ISI) mark where applicable.',
                            'Keep plastic bags and packaging away from babies and young children.',
                        ]
                    },
                ],
            },
            {
                title: 'Batteries, magnets and electronics',
                blocks: [
                    {
                        ul: [
                            'Keep button and coin batteries away from children. Swallowing them can cause serious harm and needs urgent medical help.',
                            'Use only the batteries and chargers recommended in the instructions. Do not mix old and new batteries, and do not recharge batteries that are not rechargeable.',
                            'Remove batteries when a toy will not be used for a long time.',
                            'Keep small magnets away from young children.',
                            'Electronic kits, science kits and robots should be used with adult supervision.',
                        ]
                    },
                ],
            },
            {
                title: 'Educational claims',
                blocks: [
                    { p: 'Learning benefits described on this website are general in nature and depend on how a product is used. Our products are not a substitute for professional advice on a child\'s health or development.' },
                ],
            },
            {
                title: 'Brands and third-party content',
                blocks: [
                    { p: 'Brand names and trademarks mentioned on this website belong to their respective owners. Links to other websites are provided for convenience, and we are not responsible for their content.' },
                ],
            },
            {
                title: 'Accuracy and liability',
                blocks: [
                    { p: 'We work hard to keep the website accurate and up to date, but errors can occur. To the extent permitted by law, we are not liable for loss arising from reliance on information on this website. This does not affect your rights as a consumer under Indian law.' },
                ],
            },
            {
                title: 'Questions',
                blocks: [
                    { p: `If you are unsure whether a product is suitable for your child, please contact us at ${reach} before you buy.` },
                ],
            },
        ],
    },
};

export const POLICIES = POLICY_LINKS.map((l) => ({ ...l, ...CONTENT[l.slug] }));