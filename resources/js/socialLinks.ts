import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faGithub, faLinkedin, faXTwitter } from '@fortawesome/free-brands-svg-icons';

export interface SocialLink {
    name: string;
    href: string;
    icon: IconDefinition;
}

export const socialLinks: SocialLink[] = [
    { name: 'X', href: 'https://twitter.com/SheavinNou', icon: faXTwitter },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/in/alex-nou-271323138/', icon: faLinkedin },
    { name: 'GitHub', href: 'https://github.com/NekoFluff', icon: faGithub },
];
