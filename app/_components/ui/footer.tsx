import { Card, CardContent } from "./card"

const Footer = () => {
  return (
    <footer>
      <Card className="p-0.5 text-center text-gray-400">
        <CardContent className="py-6 text-sm">
          <p className="text-sm">
            © 2025 Copyright <span className="font-bold">Yam Ferreira</span>
          </p>
        </CardContent>
      </Card>
    </footer>
  )
}

export default Footer
