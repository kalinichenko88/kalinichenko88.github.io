import EmailIcon from '../assets/icons/email.svg';
import GithubIcon from '../assets/icons/github.svg';
import LinkedinIcon from '../assets/icons/linkedin.svg';
import TelegramIcon from '../assets/icons/telegram.svg';
import TwitterIcon from '../assets/icons/twitter.svg';
import {
  GITHUB_PROFILE_LINK,
  LINKEDIN_PROFILE_LINK,
  MAIL_PROFILE_LINK,
  TELEGRAM_PROFILE_LINK,
  TWITTER_PROFILE_LINK,
} from '../consts';

type ContactLink = {
  href: string;
  label: string;
  /** The account name as a reader would type it into the app. */
  handle: string;
  Icon: typeof EmailIcon;
};

/** Every channel, in footer order. The footer and /contact both render from it. */
export const CONTACT_LINKS: ContactLink[] = [
  { href: GITHUB_PROFILE_LINK, label: 'GitHub', handle: 'kalinichenko88', Icon: GithubIcon },
  {
    href: LINKEDIN_PROFILE_LINK,
    label: 'LinkedIn',
    handle: 'ivan-kalinichenko',
    Icon: LinkedinIcon,
  },
  { href: TWITTER_PROFILE_LINK, label: 'Twitter', handle: '@joker_bsg', Icon: TwitterIcon },
  {
    href: TELEGRAM_PROFILE_LINK,
    label: 'Telegram',
    handle: '@ivan_kalinichenko',
    Icon: TelegramIcon,
  },
  {
    href: `mailto:${MAIL_PROFILE_LINK}`,
    label: 'Email',
    handle: MAIL_PROFILE_LINK,
    Icon: EmailIcon,
  },
];
