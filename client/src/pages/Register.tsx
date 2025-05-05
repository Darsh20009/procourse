import { useLocation } from "wouter";

export default function Register() {
  const [_, setLocation] = useLocation();

  // Redirect immediately when component mounts
  window.location.href = 'https://pro-courses.odoo.com/tqdym-l-lkhtbr';

  return null; // No need to render anything since we're redirecting
}