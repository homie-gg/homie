export const Footer = () => {
  return (
    <footer id="footer">
      <hr className="w-full" />
      <div className="flex gap-4 pt-14 pb-4 justify-center">
        <a href="/privacy" className="opacity-60 hover:opacity-100">
          Privacy Policy
        </a>
        <a href="/terms" className="opacity-60 hover:opacity-100">
          Terms and Conditions
        </a>
      </div>

      <section className="container pb-14 text-center">
        <h3>
          &copy; 2024{' '}
          <a
            target="_blank"
            href="https://wu.studio"
            className="text-primary transition-all border-primary hover:border-b-2"
          >
            World United Studios Limited
          </a>
        </h3>
      </section>
    </footer>
  )
}
