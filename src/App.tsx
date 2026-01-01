import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
// import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Toaster, toast } from 'sonner'

// Renbu Dojo Logo SVG Component - Orange fill with black strokes
const RenbuLogo = ({ size = 48, glow = false, className = '' }: { size?: number; glow?: boolean; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 1000 1000" 
    className={className}
    style={glow ? { filter: 'drop-shadow(0 0 15px rgba(249, 115, 22, 0.8)) drop-shadow(0 0 30px rgba(249, 115, 22, 0.5)) drop-shadow(0 0 45px rgba(249, 115, 22, 0.3))' } : {}}
  >
    {/* Orange background circle */}
    <circle cx="500" cy="500" r="450" fill="#f97316" />
    
    {/* Original Renbu paths - black */}
    <g fill="#0a0a0a">
      {/* Outer ring */}
      <path d="M964.2,500c-1.8,261.8-212,463.9-463.9,464C242.8,964.1,35.8,755.7,35.8,499.9C35.8,245.1,241.6,36.4,499.4,36 C752.2,35.6,962.5,238.4,964.2,500z M948.1,500.6c0.8-247.9-201.2-448.1-446.7-449C259,50.7,52.5,245.9,51.5,498.5 c-0.9,247.2,197.3,447.6,443.9,449.9C749.3,950.7,948.5,744.9,948.1,500.6z"/>
      
      {/* Spoke 1 - top */}
      <path d="M511.8,482.3c0.5-4,0.9-8,1.6-11.9c6.3-36.9,12.5-73.8,19.1-110.7c8-44.8,16-89.6,24.5-134.3c5.7-30.1,11.9-60.1,18.1-90.2 c1.6-7.6,3.6-15.1,5.9-22.5c1.9-6.3,3.7-7.4,10.5-7.8c10.5-0.6,20.6,1.8,30.5,4.4c16.6,4.3,32.6,10.3,48.3,17 c8.2,3.4,15.2,8.4,20.7,15.5c2,2.6,2.7,5.2,1.5,8.1c-2.1,5.4-4,10.9-6.6,16.1c-9.4,19.1-18.6,38.3-28.5,57.2 c-45.3,86-93.3,170.5-141.2,255c-0.9,1.6-2,3.1-3,4.6C512.7,482.6,512.2,482.5,511.8,482.3z"/>
      
      {/* Spoke 2 - bottom */}
      <path d="M512.3,517.9c3.1,1.8,4,4.7,5.3,7.1c26.9,47.8,54,95.6,80.7,143.6c25.7,46,51,92.1,74.7,139.2 c6.1,12.1,11.9,24.4,17.2,36.9c4.2,10.1,5.2,9.9-4.1,19.4c-3.9,4-8.5,7-13.6,9.1c-23.2,9.9-46.7,18.8-71.9,22.2 c-4.5,0.6-9,0.9-13.5-0.4c-2.7-0.8-4.7-2.2-5.5-4.9c-1.7-5.6-3.6-11.1-4.7-16.8c-6.6-31.6-13.3-63.2-19.4-94.9 c-7.2-37.7-14-75.6-20.8-113.4c-6.3-35.3-12.2-70.6-18.3-106c-2.2-12.7-4.3-25.5-6.5-38.2C511.9,520,512.2,519.2,512.3,517.9z"/>
      
      {/* Spoke 3 - right */}
      <path d="M520.8,506.2c8.1,2.1,16.1,4.2,24.2,6.4c76.7,21.4,153.5,42.5,229.6,65.7c30.2,9.2,60.2,19.3,90.2,29.1 c5.8,1.9,11.3,4.7,16.9,7.1c3.7,1.6,5.1,4.4,5.4,8.4c0.5,7.2-0.1,14.3-2.7,21c-8.4,21.4-17.8,42.3-31,61.2 c-3.1,4.5-6.7,8.7-10.6,12.6c-5.2,5.1-7.5,5.3-13.8,2c-4.9-2.5-9.7-5.2-14.3-8.2c-29.1-19.2-58.5-38-87.2-57.9 C660.4,607,593.6,559.9,526.7,513c-2.3-1.6-4.5-3.4-6.8-5.1C520.2,507.3,520.5,506.8,520.8,506.2z"/>
      
      {/* Spoke 4 - bottom left */}
      <path d="M495.2,514.5c-1,6.8-1.5,11.5-2.4,16.2c-8.3,48.3-16.4,96.7-25.2,145c-9.9,54.6-20.3,109.1-30.8,163.7 c-2.7,14.2-6.2,28.4-9.8,42.4c-2.9,11.5-4.9,13.1-16.9,12.2c-8.3-0.6-16.7-2.1-24.8-4.1c-16.9-4.3-33.2-10.3-49.3-17.2 c-11.1-4.7-16.2-9.3-22.7-19.2c0.5-5.3,2.7-10.4,5.1-15.3c10.2-20.9,20.2-41.9,31-62.5c42-80.1,86.6-158.7,131.1-237.4 c3.5-6.2,7-12.3,10.6-18.5C491.9,518.6,493,517.4,495.2,514.5z"/>
      
      {/* Spoke 5 - top left */}
      <path d="M495.3,484.8c-2-1.8-3.1-2.4-3.6-3.3c-2.5-4.1-4.9-8.4-7.3-12.6c-46-81.2-92-162.4-135.5-245 c-10.1-19.1-19.5-38.6-28.9-58.1c-2.8-5.8-4.8-11.9-7-17.6c2.6-5.8,6.4-9.7,10.8-13c3.3-2.5,6.9-4.9,10.7-6.5 c21.1-9.1,42.5-17.1,65.2-21.1c5.7-1,11.6-0.6,17.4-0.8c4.6-0.1,7.2,2.3,8.4,6.6c1.9,6.8,4.1,13.6,5.5,20.6 c7.3,35.7,14.6,71.5,21.5,107.3c6.6,34.6,12.8,69.2,18.9,103.9c6.3,35.6,12.2,71.3,18.3,106.9C491.5,462.5,493.3,472.9,495.3,484.8z"/>
      
      {/* Spoke 6 - left */}
      <path d="M484.4,509c-1.8,3.7-5.2,5.1-8,7c-46.4,32.8-92.7,65.8-139.4,98.2c-45.1,31.2-90.8,61.8-136.3,92.5 c-6.4,4.3-13.1,8.3-19.8,12.2c-3.9,2.3-8,4.2-11.8,6.2c-4.8-0.8-8-3.5-10.7-6.7c-3.9-4.7-7.8-9.5-11.2-14.6 c-11.4-17.3-19.9-36.2-27.5-55.4c-3.8-9.6-4-16.3-2-27.9c3.5-3.7,8.4-5.4,13.2-7.1c18.8-6.7,37.6-13.5,56.7-19.5 c79.6-25.1,160.1-47.5,240.5-69.9c17.7-4.9,35.4-9.8,53.1-14.6C482.2,509.1,483.1,509.1,484.4,509z"/>
      
      {/* Spoke 7 - top right area */}
      <path d="M482.9,490.8c-2.1-0.3-4-0.3-5.8-0.8c-100-27.8-200.1-55-299-86.5c-15-4.8-29.9-10.3-44.8-15.4c-1.5-0.5-3-1.1-4.5-1.8 c-12.1-5.4-12.6-4.2-12.1-19.5c0.2-5.1,1.4-10.3,3.2-15c7.4-18.6,15.6-36.9,26.5-53.7c3.3-5.1,7.1-10,11-14.7 c2-2.4,4.8-4.3,7.3-6.3c1.9-1.5,4.2-1.7,6.4-0.6c4.3,2.2,8.7,4.3,12.7,6.9c20.4,13.1,40.8,26,60.9,39.5 c78.1,52.7,155.1,107.1,231.9,161.8C478.9,486.2,482,487.1,482.9,490.8z"/>
      
      {/* Spoke 8 */}
      <path d="M519.2,493.2c2.5-1.9,5-3.9,7.6-5.7c51.5-36.3,102.8-72.7,154.6-108.6c38.7-26.9,78-53,117.1-79.4 c8-5.4,16.4-10.3,24.7-15.3c2.2-1.3,4.6-2.4,6.8-3.7c4.6-2.7,8.7-1.8,12.3,1.8c2.9,3,6.1,5.9,8.4,9.4c5.9,8.9,11.8,17.8,16.7,27.2 c5.7,10.8,10.5,22.1,15.5,33.4c3.5,8.1,5.1,16.6,4.4,25.5c-0.3,4-1.9,6.8-5.5,8.4c-4.7,2.1-9.4,4.2-14.3,6 c-29,11-58.6,19.9-88.2,28.8c-83,25.1-166.6,48.2-250.2,71.4c-3,0.8-6.1,1.4-9.2,2C519.5,494,519.3,493.6,519.2,493.2z"/>
      
      {/* Horizontal axis with end markers */}
      <path d="M484.9,498.5c-4.8,0.6-9.5,1.5-14.3,1.6c-37.8,1.4-75.5,3-113.3,3.9c-57.2,1.4-114.4,1.8-171.5,1.5 c-3.8,0-7.6,0.2-11.9,0.3c-0.3,2.4-0.8,4.2-0.8,6.1c-0.1,8.4,0,16.8-0.1,25.2c0,1.9,0.1,3.9-0.2,5.8c-0.5,3.2-3.6,5.6-6.9,5.7 c-3.3,0.1-6.5-2.2-7.2-5.3c-0.4-1.9-0.4-3.8-0.4-5.8c0-8.1,0-16.2,0-24.2c0-2.2-0.3-4.4-0.4-7.1c-2.7-0.2-4.9-0.6-7-0.6 c-11-0.1-22,0-33,0c-2.3,0-4.5,0-6.8-0.2c-1.6-0.2-3.2-0.7-4.6-1.3c-2.7-1.2-4.7-4.5-4.3-7c0.4-2.7,1.9-5.1,4.5-5.8 c3-0.9,6.3-1.4,9.5-1.5c10.3-0.2,20.7-0.1,31-0.1c3.2,0,6.4,0,10,0c0.5-2.3,1.1-4.1,1.1-6c0.1-7.1,0.1-14.2,0.1-21.3 c0-1.9-0.1-3.9,0.1-5.8c0.5-5,3.7-7.4,8.6-6.8c3.2,0.4,5.4,2.4,5.8,5.5c0.3,2.6,0.2,5.2,0.2,7.7c0,8.4,0,16.7,0.1,25.1 c3.8,2.2,7.4,1.4,10.8,1.5c26.8,0.1,53.6-0.3,80.5,0.1c41,0.6,82,1.4,123.1,2.5c26.2,0.6,52.3,1.8,78.5,2.6 C472.3,495.1,478.7,495.5,484.9,498.5z"/>
      
      {/* Bottom right diagonal markers */}
      <path d="M518.9,514.3c2.5,1.9,5.1,3.6,7.4,5.6c8.9,7.9,17.9,15.9,26.7,24c62.4,57.7,123.3,117.1,183,177.5c2.7,2.7,5.5,5.3,8.5,8.2 c7.1-7.1,13.8-13.7,20.4-20.3c1.8-1.8,3.6-3.7,5.6-5.4c3.1-2.5,6.8-2.2,9.5,0.7c2.9,2.9,3.2,6.4,0.3,9.5c-4.6,5-9.5,9.7-14.3,14.5 c-3.6,3.7-7.3,7.3-11.2,11.2c2.3,2.5,4.2,4.7,6.2,6.7c8.2,8.3,16.5,16.4,24.6,24.7c1.8,1.8,3.4,3.9,4.4,6.2 c1.3,2.8,0.9,5.7-1.4,8.1c-2.2,2.3-5.8,2.7-8.9,0.8c-2.2-1.3-4.1-3.1-5.9-4.9c-7.8-7.7-15.6-15.5-23.4-23.3c-2-2-4.2-3.9-6.7-6.3 c-1.7,1.3-3.2,2.3-4.5,3.6c-5.5,5.4-11,11-16.5,16.4c-1.4,1.4-2.7,2.8-4.3,3.8c-2.7,1.8-6.4,1.1-8.8-1.4c-2.5-2.7-3-6.1-0.7-8.7 c2.8-3.2,5.8-6,8.8-9c4.5-4.6,9.1-9.2,13.6-13.8c0.4-0.4,0.5-1.2,0.9-2.3c-8.3-9.4-17.8-18.1-26.8-27.3 c-9.1-9.2-18.3-18.3-27.4-27.4c-9.1-9.1-18.3-18.2-27.4-27.5c-9.3-9.5-18.4-19.1-27.5-28.7c-8.9-9.3-17.9-18.7-26.8-28 c-8.9-9.4-17.8-18.7-26.7-28.2c-8.8-9.4-17.7-18.9-26.4-28.4c-8.7-9.5-17.6-18.9-25.5-29.1C518,515.3,518.5,514.8,518.9,514.3z"/>
      
      {/* Top left diagonal markers */}
      <path d="M255.8,244.9c6.5-6.5,12.4-12.5,18.4-18.4c1.8-1.8,3.6-3.7,5.6-5.4c3.2-2.6,6.7-2.3,9.5,0.6c2.8,2.9,3.2,6.4,0.4,9.5 c-3.2,3.6-6.8,6.9-10.2,10.4c-4.3,4.3-8.7,8.7-13.1,13.1c1.7,3.7,4.6,5.7,7.1,8.2c25.8,25.9,52,51.3,77.3,77.7 c39.8,41.5,79.1,83.6,118.5,125.4c4.4,4.6,8.5,9.5,12.4,14.8c-3,1.3-4.2-0.6-5.5-1.7c-10.7-9.4-21.4-18.7-31.8-28.4 c-54-50.2-107.2-101.1-159-153.6c-8.2-8.3-16.4-16.5-24.7-24.7c-1.8-1.8-3.7-3.4-6.1-5.5c-2.9,2.7-5.4,5-7.9,7.5 c-6,5.9-11.8,12-17.9,17.7c-3.4,3.1-8.3,2.1-10.7-1.9c-1.5-2.4-1.7-4.9,0.1-7.3c1.2-1.5,2.6-2.9,3.9-4.3 c5.7-5.7,11.4-11.4,17.1-17.2c1.5-1.6,2.9-3.3,4.7-5.3c-1.5-1.7-2.6-3.2-3.9-4.6c-8.4-8.5-16.9-16.9-25.3-25.4 c-1.8-1.8-3.6-3.7-5.1-5.8c-2-3-1.8-6.7,0.2-9c2.1-2.6,6.4-3.4,9.7-1.4c2.2,1.3,4.1,3.1,5.9,4.9c7.8,7.7,15.5,15.5,23.3,23.3 C250.9,240.2,253,242.2,255.8,244.9z"/>
      
      {/* Right horizontal axis with markers */}
      <path d="M521.9,499.9c2.2-3.1,5.3-2.7,8.1-2.9c15.8-0.8,31.6-1.7,47.4-2.2c38.7-1.2,77.5-2.2,116.2-3.2c12.3-0.3,24.5-0.5,36.8-0.5 c30.4-0.1,60.7,0,91.1,0c3.5,0,7-0.2,11.1-0.3c0.3-2.2,0.8-4,0.8-5.8c0.1-7.1,0-14.2,0-21.3c0-2.3-0.1-4.5,0.2-6.8 c0.5-3.6,4-6.3,7.6-6.1c3.7,0.2,6.7,2.9,6.9,6.8c0.2,4.5,0.1,9,0.1,13.6c0,6.1,0,12.2,0,18.9c2.5,0.4,4.6,1,6.7,1 c11.9,0.1,23.9,0,35.8,0.1c2.6,0,5.2,0.1,7.6,0.8c3.9,1.1,6.4,4.6,6,7.8c-0.4,3.3-3.3,6.2-7.3,6.6c-2.6,0.3-5.2,0.3-7.7,0.3 c-11.6,0-23.3,0-34.9,0c-1.6,0-3.2,0.2-5.3,0.4c-0.4,2-0.9,3.8-1,5.6c-0.1,8.1,0,16.1-0.1,24.2c0,2.3,0.1,4.5-0.1,6.8 c-0.4,3.8-3.4,6.4-7.2,6.4c-3.8,0-7-2.5-7.1-6.5c-0.3-8.1-0.1-16.1-0.2-24.2c-0.1-3.8,0.7-7.7-0.9-11.4c-3-2-6.4-1.2-9.5-1.2 c-14.5-0.1-29.1,0-43.6,0c-34.9-0.1-69.8,0-104.6-0.6c-36.5-0.7-72.9-2.1-109.4-3.3c-13.2-0.5-26.4-1.4-39.6-2.2 C524.5,500.5,523.4,500.1,521.9,499.9z"/>
      
      {/* Bottom vertical axis */}
      <path d="M493.8,830.2c0-4.2,0-7.4,0-10.5c0-11.3,0.1-22.6,0-33.9c-0.6-53.9,0.9-107.9,2.1-161.8c0.7-31,2.3-62,3.6-92.9 c0.2-3.8,0.2-7.7,2-11.5c2.1,0.8,1.7,2.5,1.9,3.8c0.5,4.2,1.1,8.3,1.3,12.5c0.8,20,1.7,40,2.3,60c0.9,31.3,1.8,62.6,2.1,93.9 c0.5,42.9,0.4,85.9,0.6,128.9c0,3.5,0.2,7,0.3,11.1c2.2,0.3,4,0.8,5.8,0.8c7.4,0.1,14.9,0,22.3,0.1c1.9,0,3.9-0.1,5.8,0.2 c4,0.6,6.2,3.4,6.1,7.4c-0.1,3.9-2.4,6.8-6.6,6.9c-7.4,0.3-14.9,0-22.3,0.2c-3.5,0.1-7.1-0.8-10.9,1.3c-0.2,2.6-0.5,5.5-0.5,8.3 c-0.1,11,0,22-0.1,32.9c0,2.6-0.1,5.2-0.6,7.7c-0.7,3.2-3.9,6-6.8,6c-3.2,0-5.7-1.7-6.7-4.6c-0.9-2.7-1.4-5.6-1.5-8.5 c-0.2-10.7-0.1-21.3-0.1-32c0-3.2,0-6.4,0-10c-2.3-0.4-4.1-1.1-5.9-1.1c-8.4-0.1-16.8,0-25.2-0.1c-2.3,0-4.5,0-6.7-0.4 c-2.8-0.5-4.9-3.4-5.1-6.3c-0.3-3.3,1.8-6.7,4.9-7.5c1.8-0.5,3.8-0.5,5.8-0.5c7.4-0.1,14.9,0,22.3,0 C486.7,830.6,489.6,830.4,493.8,830.2z"/>
      
      {/* Top right diagonal */}
      <path d="M754.9,260.7c7.2,7.2,14,14.1,20.8,21c1.8,1.8,3.7,3.6,5.3,5.6c2.1,2.7,1.5,6.1-1.1,8.7c-2.7,2.7-5.9,3.2-8.7,1 c-2-1.6-3.8-3.4-5.7-5.3c-6.9-6.8-13.7-13.7-21-20.9c-2.7,2.6-5.1,4.7-7.4,6.9c-19.2,19.2-38.3,38.4-57.6,57.5 c-46.5,46.2-94.1,91.4-142.4,135.7c-5.9,5.4-11.9,10.8-18.4,15.6c-1.6-2.4,0.1-3.5,1-4.5c5-5.9,9.9-11.9,15.3-17.5 c41.5-43.8,83-87.8,124.8-131.3c21.5-22.3,43.8-43.9,65.7-65.9c2.3-2.3,4.4-4.6,6.3-6.6c0.4-2.9-1.5-4-2.7-5.3 c-5-5.1-10-10.1-15.1-15.1c-1.4-1.4-2.8-2.7-4.1-4.1c-3.8-4.3-3.3-8.3,1.4-11.4c2.5-1.7,4.8-1.8,7.2,0c2,1.6,3.9,3.4,5.7,5.2 c6.2,6.1,12.3,12.3,18.8,18.8c2-1.7,3.9-2.9,5.4-4.5c9-8.9,17.8-17.8,26.8-26.7c2.3-2.3,4.7-4.4,8.3-4.4c4.8-0.1,7.8,3.2,7.2,8.1 c-0.4,3.5-2.8,5.7-5.1,8c-8.2,8.2-16.5,16.4-24.6,24.7C758.9,256.1,757.1,258.3,754.9,260.7z"/>
      
      {/* Bottom left diagonal */}
      <path d="M255.3,756.3c-2.2,2-4.3,3.9-6.4,5.9c-7.6,7.5-15.1,15.1-22.6,22.6c-1.8,1.8-3.7,3.7-5.8,5.2c-3.5,2.5-8.2,2.1-10.6-0.7 c-2.2-2.6-2.3-6.6,0.1-9.8c1.3-1.8,3-3.4,4.6-5c8-8,16-16,24-24c1.8-1.8,3.4-3.8,5.4-6c-1.7-2-3-3.7-4.6-5.2 c-6.6-6.7-13.3-13.2-19.8-19.9c-4.1-4.3-3.3-9.2,1.7-12c2.2-1.2,4.4-1.3,6.3,0.2c2,1.6,3.9,3.4,5.7,5.2 c6.9,6.8,13.7,13.7,20.3,20.3c3.8-0.2,5.3-3.1,7.3-5c23.3-23.3,46.4-46.8,69.9-69.9c45.7-44.7,91.8-89,139.4-131.7 c3.1-2.8,6.4-5.3,9.7-8c2.3,2.6-0.2,3.8-1.2,5c-13.6,15.2-27.1,30.3-41,45.2c-53.4,57.5-108.4,113.5-164.2,168.7 c-2.5,2.5-4.8,5.1-7.7,8.1c6.5,6.5,12.7,12.7,18.8,18.8c1.8,1.8,3.7,3.6,5.3,5.6c2.2,2.7,1.8,6.2-0.6,8.8c-3,3.2-6.4,3.7-9.4,0.9 c-5.7-5.2-11-10.9-16.6-16.2C261,760.9,259,757.9,255.3,756.3z"/>
      
      {/* Top vertical axis */}
      <path d="M502.7,482.5c-2.9-3.9-2.9-7.2-3.1-10.4c-0.8-13.5-1.6-27.1-2-40.6c-1.1-38.4-2.3-76.8-2.9-115.3 c-0.6-44.6-0.6-89.1-0.9-133.7c0-3.8-0.1-7.7-0.2-11.9c-2.3-0.4-4.1-1.1-5.9-1.1c-8.1-0.1-16.2,0-24.2-0.1c-2.3,0-4.5,0-6.8-0.2 c-3.6-0.4-5.8-2.9-5.8-6.5c-0.1-3.9,2.4-7.1,6.2-7.2c8.4-0.2,16.8-0.1,25.2-0.2c3.5,0,7-0.2,11-0.4c0.2-3.4,0.5-6.2,0.5-9 c0.1-11,0-22,0.1-32.9c0-2.6,0.1-5.2,0.7-7.7c1-4.1,4-6.4,7.5-6.3c3.5,0.1,6.4,2.6,7.1,6.7c0.4,2.5,0.4,5.1,0.4,7.7 c0,10.7,0,21.3,0,32c0,2.9,0.2,5.7,0.4,9.2c2.5,0.3,4.7,0.7,6.8,0.7c8.7,0.1,17.4-0.1,26.2,0.1c4.5,0.1,6.7,2.4,6.9,6.4 c0.3,4.2-1.8,7.1-5.9,7.3c-6.4,0.3-12.9,0.1-19.4,0.3c-4.5,0.1-9-0.6-13.9,0.8c-0.3,1.8-0.9,3.6-1,5.4c-0.2,2.9-0.1,5.8-0.1,8.7 c-0.3,54.9-0.3,109.8-1.2,164.7c-0.6,38.1-2.4,76.2-3.7,114.3C504.5,469.4,503.5,475.3,502.7,482.5z"/>
    </g>
  </svg>
)


import { 
  Users, Settings, Trophy, Play, Pause, RotateCcw, 
  Plus, Trash2, Upload, Search, Filter, X, Edit2,
  Menu, Swords, UserPlus,
  CheckCircle2, Table, History, RefreshCw,
  ArrowLeftRight, Award, ChevronLeft, Undo2, ChevronDown, ChevronUp
} from 'lucide-react'

// Types
interface Member {
  id: string
  firstName: string
  lastName: string
  group: string
  isGuest: boolean
  guestDojo?: string
  isParticipating: boolean
}

interface Group {
  id: string
  name: string
  isNonBogu: boolean
}

interface Match {
  id: string
  groupId: string
  player1Id: string
  player2Id: string
  player1Score: number[]  // Score IDs: 1=Men, 2=Kote, 3=Do, 4=Tsuki, 5=Hansoku (opponent got 2)
  player2Score: number[]
  player1Hansoku: number  // Count of hansoku for player 1
  player2Hansoku: number  // Count of hansoku for player 2
  winner: string | null
  status: 'pending' | 'in_progress' | 'completed'
  court: 'A' | 'B'
  isHantei: boolean
  matchType: 'sanbon' | 'ippon'  // sanbon = first to 2, ippon = first to 1
  timerDuration: number  // in seconds
  actualDuration?: number  // recorded when match completes
  orderIndex: number
}

interface Tournament {
  id: string
  name: string
  date: string
  month: string
  year: number
  status: 'setup' | 'in_progress' | 'completed'
  matches: Match[]
  groups: string[]
  groupOrder: string[]
  timerOptions: number[]  // Available timer durations in seconds
  defaultTimerDuration: number  // Default timer duration
}

interface TournamentHistory {
  id: string
  name: string
  date: string
  month: string
  year: number
  results: {
    groupId: string
    groupName: string
    isNonBogu: boolean
    standings: {
      rank: number
      playerName: string
      points: number
      wins: number
      losses: number
      draws: number
    }[]
  }[]
}

interface PlayerStanding {
  playerId: string
  playerName: string
  points: number
  wins: number
  draws: number
  losses: number
  gamesLeft: number
  ipponsScored: number
  ipponsAgainst: number
  results: Map<string, 'W' | 'L' | 'D' | null>
}

interface AppState {
  members: Member[]
  courtASelectedMatch: string | null  // Override queue with this match
  courtBSelectedMatch: string | null
  courtAGroupOrder: string[]  // Custom group order for Court A queue
  courtBGroupOrder: string[]  // Custom group order for Court B queue
  sharedGroups: string[]  // Groups that run on both courts simultaneously
  groups: Group[]
  guestRegistry: Member[]
  currentTournament: Tournament | null
  currentMatchIndexA: number
  currentMatchIndexB: number
  activeCourt: 'A' | 'B'
  timerSecondsA: number
  timerSecondsB: number
  timerRunningA: boolean
  timerRunningB: boolean
  timerTarget: number
  history: TournamentHistory[]
  lastUpdated?: number
  useFirstNamesOnly: boolean
}

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9)

// Helper to format member display name
const formatDisplayName = (member: Member, allMembers: Member[], useFirstNamesOnly: boolean): string => {
  if (!useFirstNamesOnly) {
    return `${member.lastName}, ${member.firstName}`
  }
  
  // Check if there are multiple people with the same first name
  const sameFirstName = allMembers.filter(m => 
    m.firstName.toLowerCase() === member.firstName.toLowerCase() && m.id !== member.id
  )
  
  if (sameFirstName.length > 0) {
    // Add last name initial for disambiguation
    return `${member.firstName} ${member.lastName[0]}.`
  }
  
  return member.firstName
}


// Test data generation


const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Generate round robin with rest optimization
const generateRoundRobinWithRest = (playerIds: string[]): [string, string][] => {
  if (playerIds.length < 2) return []
  
  const players = [...playerIds]
  if (players.length % 2 !== 0) {
    players.push('BYE')
  }
  
  const n = players.length
  const rounds: [string, string][][] = []
  
  for (let round = 0; round < n - 1; round++) {
    const roundMatches: [string, string][] = []
    for (let i = 0; i < n / 2; i++) {
      const p1 = players[i]
      const p2 = players[n - 1 - i]
      if (p1 !== 'BYE' && p2 !== 'BYE') {
        roundMatches.push([p1, p2])
      }
    }
    rounds.push(roundMatches)
    const last = players.pop()!
    players.splice(1, 0, last)
  }
  
  const allMatches: [string, string][] = []
  const lastPlayed: Map<string, number> = new Map()
  const flatMatches = rounds.flat()
  const used = new Set<number>()
  
  while (allMatches.length < flatMatches.length) {
    let bestMatch = -1
    let bestScore = -1
    
    for (let i = 0; i < flatMatches.length; i++) {
      if (used.has(i)) continue
      const [p1, p2] = flatMatches[i]
      const p1Last = lastPlayed.get(p1) ?? -10
      const p2Last = lastPlayed.get(p2) ?? -10
      const minRest = Math.min(allMatches.length - p1Last, allMatches.length - p2Last)
      
      if (minRest > bestScore) {
        bestScore = minRest
        bestMatch = i
      }
    }
    
    if (bestMatch === -1) break
    
    used.add(bestMatch)
    const [p1, p2] = flatMatches[bestMatch]
    lastPlayed.set(p1, allMatches.length)
    lastPlayed.set(p2, allMatches.length)
    allMatches.push([p1, p2])
  }
  
  return allMatches
}

// Calculate standings for a group
const calculateStandings = (
  groupId: string,
  matches: Match[],
  members: Member[],
  useFirstNamesOnly: boolean = false
): PlayerStanding[] => {
  const groupMatches = matches.filter(m => m.groupId === groupId && m.status === 'completed')
  const allGroupMatches = matches.filter(m => m.groupId === groupId)
  const groupMembers = members.filter(m => m.group === groupId && m.isParticipating)
  
  const standings: Map<string, PlayerStanding> = new Map()
  
  groupMembers.forEach(member => {
    // Count pending/in_progress matches for this player
    const pendingMatches = allGroupMatches.filter(m => 
      m.status !== 'completed' && (m.player1Id === member.id || m.player2Id === member.id)
    )
    
    standings.set(member.id, {
      playerId: member.id,
      playerName: formatDisplayName(member, groupMembers, useFirstNamesOnly),
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gamesLeft: pendingMatches.length,
      ipponsScored: 0,
      ipponsAgainst: 0,
      results: new Map(),
    })
  })
  
  groupMatches.forEach(match => {
    const p1Standing = standings.get(match.player1Id)
    const p2Standing = standings.get(match.player2Id)
    
    if (!p1Standing || !p2Standing) return
    
    const p1Ippons = match.player1Score.length
    const p2Ippons = match.player2Score.length
    
    p1Standing.ipponsScored += p1Ippons
    p1Standing.ipponsAgainst += p2Ippons
    p2Standing.ipponsScored += p2Ippons
    p2Standing.ipponsAgainst += p1Ippons
    
    if (match.winner === 'player1') {
      p1Standing.points += 2
      p1Standing.wins += 1
      p2Standing.losses += 1
      p1Standing.results.set(match.player2Id, 'W')
      p2Standing.results.set(match.player1Id, 'L')
    } else if (match.winner === 'player2') {
      p2Standing.points += 2
      p2Standing.wins += 1
      p1Standing.losses += 1
      p1Standing.results.set(match.player2Id, 'L')
      p2Standing.results.set(match.player1Id, 'W')
    } else if (match.winner === 'draw') {
      p1Standing.points += 1
      p2Standing.points += 1
      p1Standing.draws += 1
      p2Standing.draws += 1
      p1Standing.results.set(match.player2Id, 'D')
      p2Standing.results.set(match.player1Id, 'D')
    }
  })
  
  return Array.from(standings.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins
    return b.ipponsScored - a.ipponsScored
  })
}

// Firebase Realtime Database for cross-device sync
const FIREBASE_URL = 'https://shiaijo-7412f-default-rtdb.firebaseio.com'
const STORAGE_KEY = 'renbu-shiai-data-v3'

// Save to Firebase + localStorage backup
const saveToStorage = async (state: AppState) => {
  try {
    const serializable = { ...state, lastUpdated: Date.now() }
    
    // Save to Firebase (cross-device sync)
    fetch(`${FIREBASE_URL}/tournament.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serializable)
    }).catch(e => console.error('Firebase save error:', e))
    
    // Also save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
  } catch (e) {
    console.error('Storage save error:', e)
  }
}

// Load from Firebase with localStorage fallback
const loadFromStorage = async (): Promise<AppState | null> => {
  try {
    const response = await fetch(`${FIREBASE_URL}/tournament.json`)
    if (response.ok) {
      const data = await response.json()
      if (data) {
        // Update localStorage with latest from Firebase
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        return data as AppState
      }
    }
  } catch (e) {
    console.error('Firebase load error:', e)
  }
  
  // Fallback to localStorage
  try {
    const local = localStorage.getItem(STORAGE_KEY)
    if (local) return JSON.parse(local) as AppState
  } catch (e) {
    console.error('localStorage load error:', e)
  }
  return null
}


// Helper to ensure match data is valid
const sanitizeMatch = (match: Match): Match => ({
  ...match,
  player1Score: match.player1Score || [],
  player2Score: match.player2Score || [],
  player1Hansoku: match.player1Hansoku || 0,
  player2Hansoku: match.player2Hansoku || 0,
  status: match.status || 'pending',
  winner: match.winner || null,
  matchType: match.matchType || 'sanbon',
  timerDuration: match.timerDuration || 180,
})

const sanitizeTournament = (tournament: Tournament | null): Tournament | null => {
  if (!tournament) return null
  return {
    ...tournament,
    matches: (tournament.matches || []).map(sanitizeMatch),
    groups: tournament.groups || [],
    groupOrder: tournament.groupOrder || [],
  }
}

// Default state
const defaultGroups: Group[] = [
  { id: 'A', name: 'Group A', isNonBogu: false },
  { id: 'B', name: 'Group B', isNonBogu: false },
  { id: 'C', name: 'Group C', isNonBogu: false },
  { id: 'D', name: 'Group D', isNonBogu: false },
  { id: 'NonBogu', name: 'Non-Bogu', isNonBogu: true },
]

const defaultState: AppState = {
  members: [],
  courtASelectedMatch: null,
  courtBSelectedMatch: null,
  courtAGroupOrder: [],
  courtBGroupOrder: [],
  sharedGroups: [],
  groups: defaultGroups,
  guestRegistry: [],
  currentTournament: null,
  currentMatchIndexA: 0,
  currentMatchIndexB: 0,
  activeCourt: 'A',
  timerSecondsA: 0,
  timerSecondsB: 0,
  timerRunningA: false,
  timerRunningB: false,
  timerTarget: 180,
  history: [],
  useFirstNamesOnly: true,
}

// Device detection hook
const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
    }
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])
  
  return isMobile
}

// Main App Component
export default function App() {
  const [portal, setPortal] = useState<'select' | 'admin' | 'courtkeeper'>('select')
  const [state, setState] = useState<AppState>(defaultState)
  const [loading, setLoading] = useState(true)
  const isMobile = useDeviceDetection()
  const timerRefA = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRefB = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const load = async () => {
      // Try to load from Firebase first, with retries
      let saved = null
      for (let i = 0; i < 3; i++) {
        saved = await loadFromStorage()
        if (saved && saved.members && saved.members.length > 0) break
        await new Promise(r => setTimeout(r, 500)) // Wait 500ms between retries
      }
      
      if (saved) {
        setState({
          ...defaultState,
          ...saved,
          members: saved.members || [],
          groups: saved.groups || defaultGroups,
          guestRegistry: saved.guestRegistry || [],
          history: saved.history || [],
          currentTournament: sanitizeTournament(saved.currentTournament),
          currentMatchIndexA: saved.currentMatchIndexA ?? 0,
          currentMatchIndexB: saved.currentMatchIndexB ?? 0,
          activeCourt: saved.activeCourt || 'A',
          timerSecondsA: saved.timerSecondsA ?? 0,
          timerSecondsB: saved.timerSecondsB ?? 0,
          timerRunningA: saved.timerRunningA ?? false,
          timerRunningB: saved.timerRunningB ?? false,
          lastUpdated: saved.lastUpdated || Date.now(),
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!loading) saveToStorage(state)
  }, [state, loading])

  useEffect(() => {
    if (portal !== 'select') {
      pollRef.current = setInterval(async () => {
        const saved = await loadFromStorage()
        if (saved) {
          // Ensure tournament has all required properties
          let tournament = sanitizeTournament(saved.currentTournament)
          if (tournament) {
            tournament = {
              ...tournament,
              matches: tournament.matches || [],
              groups: tournament.groups || [],
              groupOrder: tournament.groupOrder || [],
            }
          }
          setState(prev => ({
            ...prev,
            currentTournament: tournament,
            currentMatchIndexA: saved.currentMatchIndexA ?? prev.currentMatchIndexA,
            currentMatchIndexB: saved.currentMatchIndexB ?? prev.currentMatchIndexB,
            timerSecondsA: saved.timerSecondsA ?? prev.timerSecondsA,
            timerSecondsB: saved.timerSecondsB ?? prev.timerSecondsB,
            timerRunningA: saved.timerRunningA ?? prev.timerRunningA,
            timerRunningB: saved.timerRunningB ?? prev.timerRunningB,
          }))
        }
      }, 1000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [portal])

  // Timer logic for Court A
  useEffect(() => {
    if (state.timerRunningA) {
      timerRefA.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          timerSecondsA: Math.min(prev.timerSecondsA + 1, prev.timerTarget)
        }))
      }, 1000)
    } else {
      if (timerRefA.current) clearInterval(timerRefA.current)
    }
    return () => { if (timerRefA.current) clearInterval(timerRefA.current) }
  }, [state.timerRunningA, state.timerTarget])

  // Timer logic for Court B
  useEffect(() => {
    if (state.timerRunningB) {
      timerRefB.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          timerSecondsB: Math.min(prev.timerSecondsB + 1, prev.timerTarget)
        }))
      }, 1000)
    } else {
      if (timerRefB.current) clearInterval(timerRefB.current)
    }
    return () => { if (timerRefB.current) clearInterval(timerRefB.current) }
  }, [state.timerRunningB, state.timerTarget])

  const getMemberById = useCallback((id: string) => {
    if (!id) return undefined
    return state.members.find(m => m.id === id)
  }, [state.members])
  const getGroupById = useCallback((id: string) => state.groups.find(g => g.id === id), [state.groups])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1017] flex flex-col items-center justify-center">
        <div className="mb-6 animate-pulse">
          <RenbuLogo size={96} glow />
        </div>
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (portal === 'select') {
    return (
      <div className="min-h-screen bg-[#0a1017] flex items-center justify-center p-4">
        <Toaster theme="dark" position="top-center" />
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <RenbuLogo size={80} glow />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: '"sicyubi-fudegyosho", "Yuji Syuku", serif' }}>試合場</h1>
            <p className="text-[#6b8fad]">Tournament Manager</p>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={() => setPortal('admin')}
              className="w-full bg-[#142130] border border-white/5 rounded-2xl p-5 text-left hover:border-orange-500/50 hover:bg-[#252530] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center group-hover:from-orange-500/30 group-hover:to-orange-600/20 transition-colors">
                  <Settings className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Admin Portal</h2>
                  <p className="text-sm text-[#6b8fad]">Manage members, groups & tournament</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => setPortal('courtkeeper')}
              className="w-full bg-[#142130] border border-white/5 rounded-2xl p-5 text-left hover:border-[#2a4a6f]/50 hover:bg-[#252530] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2a4a6f]/20 to-[#1e3a5f]/10 flex items-center justify-center group-hover:from-[#2a4a6f]/30 group-hover:to-[#1e3a5f]/20 transition-colors">
                  <Swords className="w-6 h-6 text-[#2a4a6f]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Courtkeeper Portal</h2>
                  <p className="text-sm text-[#6b8fad]">Run matches & keep score</p>
                </div>
              </div>
            </button>
          </div>

          <p className="text-center text-xs text-[#4a6a8a]">Renbu Dojo</p>
        </div>
      </div>
    )
  }

  if (portal === 'admin') {
    return (
      <AdminPortal 
        state={state} 
        setState={setState} 
        isMobile={isMobile}
        onSwitchPortal={() => setPortal('select')}
        getMemberById={getMemberById}
        getGroupById={getGroupById}
      />
    )
  }

  return (
    <CourtkeeperPortal 
      state={state} 
      setState={setState} 
      isMobile={isMobile}
      onSwitchPortal={() => setPortal('select')}
      getMemberById={getMemberById}
      getGroupById={getGroupById}
    />
  )
}

// Admin Portal Component
function AdminPortal({ 
  state, 
  setState, 
  onSwitchPortal,
  getMemberById,
  getGroupById
}: { 
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  isMobile: boolean
  onSwitchPortal: () => void
  getMemberById: (id: string) => Member | undefined
  getGroupById: (id: string) => Group | undefined
}) {
  const [activeTab, setActiveTab] = useState('members')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [sortBy] = useState<'name' | 'group'>('name')
  const [showAddMember, setShowAddMember] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const filteredMembers = state.members
    .filter(m => {
      const matchesSearch = `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesGroup = filterGroup === 'all' || m.group === filterGroup
      return matchesSearch && matchesGroup
    })
    .sort((a, b) => {
      if (sortBy === 'name') return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
      return a.group.localeCompare(b.group)
    })

  const addMember = (firstName: string, lastName: string, group: string) => {
    if (!firstName || !lastName || !group) {
      toast.error('Please fill all fields')
      return
    }
    const newMember: Member = {
      id: generateId(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      group,
      isGuest: false,
      isParticipating: false,
    }
    setState(prev => ({ ...prev, members: [...prev.members, newMember] }))
    toast.success(`${firstName} ${lastName} added`)
  }

  const addGuestMember = (firstName: string, lastName: string, group: string, guestDojo?: string) => {
    const newMember: Member = {
      id: generateId(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      group,
      isGuest: true,
      guestDojo,
      isParticipating: false,
    }
    const existsInRegistry = state.guestRegistry.some(
      g => g.firstName === firstName && g.lastName === lastName
    )
    setState(prev => ({
      ...prev,
      members: [...prev.members, newMember],
      guestRegistry: existsInRegistry ? prev.guestRegistry : [...prev.guestRegistry, { ...newMember, isParticipating: false }]
    }))
    toast.success(`Guest ${firstName} ${lastName} added`)
  }

  const deleteMember = (id: string) => {
    setState(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }))
  }

  const clearAllMembers = () => {
    setState(prev => ({ ...prev, members: [] }))
    setShowClearConfirm(false)
    toast.success('All members cleared')
  }

  const toggleParticipation = (id: string) => {
    setState(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === id ? { ...m, isParticipating: !m.isParticipating } : m)
    }))
  }

  const selectByGroup = (groupId: string) => {
    setState(prev => ({
      ...prev,
      members: prev.members.map(m => m.group === groupId ? { ...m, isParticipating: true } : m)
    }))
  }

  const deselectAll = () => {
    setState(prev => ({
      ...prev,
      members: prev.members.map(m => ({ ...m, isParticipating: false }))
    }))
  }

  const handleCSVImport = (csvText: string) => {
    const lines = csvText.trim().split('\n')
    const newMembers: Member[] = []
    const startIdx = lines[0].toLowerCase().includes('firstname') || lines[0].toLowerCase().includes('first') ? 1 : 0
    
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim().replace(/"/g, ''))
      if (parts.length >= 3) {
        const [firstName, lastName, group] = parts
        if (firstName && lastName && group) {
          const groupId = state.groups.find(g => g.id === group || g.name === group)?.id || state.groups[0]?.id
          newMembers.push({
            id: generateId(),
            firstName,
            lastName,
            group: groupId,
            isGuest: false,
            isParticipating: false,
          })
        }
      }
    }
    
    if (newMembers.length === 0) {
      toast.error('No valid members found. Format: FirstName,LastName,Group')
      return
    }
    setState(prev => ({ ...prev, members: [...prev.members, ...newMembers] }))
    toast.success(`${newMembers.length} members imported`)
  }

  const generateTournament = (selectedMonth: string, selectedYear: number, date: string) => {
    const participants = state.members.filter(m => m.isParticipating)
    
    const participantsByGroup = new Map<string, Member[]>()
    participants.forEach(p => {
      const existing = participantsByGroup.get(p.group) || []
      participantsByGroup.set(p.group, [...existing, p])
    })
    
    const allMatches: Match[] = []
    let globalOrderIndex = 0
    const groupOrder = state.groups.filter(g => participantsByGroup.has(g.id)).map(g => g.id)
    
    // Process groups in order - each group gets assigned to one court
    // Odd groups (1st, 3rd, 5th) → Court A, Even groups (2nd, 4th, 6th) → Court B
    groupOrder.forEach((groupId, groupIndex) => {
      const groupParticipants = participantsByGroup.get(groupId)
      if (!groupParticipants || groupParticipants.length < 2) return
      
      const group = getGroupById(groupId)
      const isHantei = group?.isNonBogu || false
      const matchPairs = generateRoundRobinWithRest(groupParticipants.map(p => p.id))
      const court = groupIndex % 2 === 0 ? 'A' : 'B'
      
      matchPairs.forEach((pair) => {
        allMatches.push({
          id: generateId(),
          groupId,
          player1Id: pair[0],
          player2Id: pair[1],
          player1Score: [],
          player2Score: [],
          player1Hansoku: 0,
          player2Hansoku: 0,
          winner: null,
          status: 'pending',
          court,
          isHantei,
          matchType: isHantei ? 'ippon' : 'sanbon',
          timerDuration: 180,
          orderIndex: globalOrderIndex++,
        })
      })
    })
    
    // Allow empty tournament - can be refreshed later with participants
    const tournament: Tournament = {
      id: generateId(),
      name: `Renbu Monthly Shiai - ${selectedMonth} ${selectedYear}`,
      date: date,
      month: selectedMonth,
      year: selectedYear,
      status: 'setup',
      matches: allMatches,
      groups: [...participantsByGroup.keys()],
      groupOrder,
      timerOptions: [120, 180, 240, 300],
      defaultTimerDuration: 180,
    }
    
    setState(prev => ({ 
      ...prev, 
      currentTournament: tournament,
      currentMatchIndexA: 0,
      currentMatchIndexB: 0,
      timerSecondsA: 0,
      timerSecondsB: 0,
      timerRunningA: false,
      timerRunningB: false,
    }))
    
    if (allMatches.length === 0) {
      toast.success(`Empty tournament created for ${selectedMonth} ${selectedYear}. Add participants and refresh to generate matches.`)
    } else {
      toast.success(`Tournament generated with ${allMatches.length} matches across ${participantsByGroup.size} groups`)
    }
  }

  const refreshTournamentParticipants = () => {
    if (!state.currentTournament) {
      toast.error('No active tournament')
      return
    }
    
    const participants = state.members.filter(m => m.isParticipating)
    if (participants.length < 2) {
      toast.error('Need at least 2 participants')
      return
    }
    
    const participantsByGroup = new Map<string, Member[]>()
    participants.forEach(p => {
      const existing = participantsByGroup.get(p.group) || []
      participantsByGroup.set(p.group, [...existing, p])
    })
    
    // Keep completed and in-progress matches
    const existingMatches = state.currentTournament.matches || []
    const completedMatches = existingMatches.filter(m => m.status === 'completed' || m.status === 'in_progress')
    
    const newMatches: Match[] = []
    let globalOrderIndex = 0
    const groupOrder = state.groups.filter(g => participantsByGroup.has(g.id)).map(g => g.id)
    
    groupOrder.forEach((groupId, groupIndex) => {
      const groupParticipants = participantsByGroup.get(groupId)
      if (!groupParticipants || groupParticipants.length < 2) return
      
      const group = getGroupById(groupId)
      const isHantei = group?.isNonBogu || false
      const matchPairs = generateRoundRobinWithRest(groupParticipants.map(p => p.id))
      const court = groupIndex % 2 === 0 ? 'A' : 'B'
      
      matchPairs.forEach((pair) => {
        // Check if this match already exists (same players, same group)
        const existingMatch = completedMatches.find(m => 
          m.groupId === groupId &&
          ((m.player1Id === pair[0] && m.player2Id === pair[1]) ||
           (m.player1Id === pair[1] && m.player2Id === pair[0]))
        )
        
        if (existingMatch) {
          // Keep the existing match with its results
          newMatches.push({ ...existingMatch, orderIndex: globalOrderIndex++ })
        } else {
          // Create new pending match
          newMatches.push({
            id: generateId(),
            groupId,
            player1Id: pair[0],
            player2Id: pair[1],
            player1Score: [],
            player2Score: [],
            player1Hansoku: 0,
            player2Hansoku: 0,
            winner: null,
            status: 'pending',
            court,
            isHantei,
            matchType: isHantei ? 'ippon' : 'sanbon',
            timerDuration: state.currentTournament?.defaultTimerDuration || 180,
            orderIndex: globalOrderIndex++,
          })
        }
      })
    })
    
    if (newMatches.length === 0) {
      toast.error('No matches could be generated')
      return
    }
    
    const keptCount = newMatches.filter(m => m.status === 'completed' || m.status === 'in_progress').length
    
    setState(prev => ({
      ...prev,
      currentTournament: {
        ...prev.currentTournament!,
        matches: newMatches,
        groups: [...participantsByGroup.keys()],
        groupOrder,
      },
      currentMatchIndexA: 0,
      currentMatchIndexB: 0,
    }))
    
    toast.success(`Refreshed: ${newMatches.length} matches (${keptCount} preserved)`)
  }

  const archiveTournament = () => {
    if (!state.currentTournament) return
    
    const results = state.currentTournament.groups.map(groupId => {
      const group = getGroupById(groupId)
      const standings = calculateStandings(groupId, state.currentTournament!.matches, state.members, state.useFirstNamesOnly)
      return {
        groupId,
        groupName: group?.name || groupId,
        isNonBogu: group?.isNonBogu || false,
        standings: standings.map((s, idx) => ({
          rank: idx + 1,
          playerName: s.playerName,
          points: s.points,
          wins: s.wins,
          losses: s.losses,
          draws: s.draws,
        }))
      }
    })
    
    const historyEntry: TournamentHistory = {
      id: generateId(),
      name: state.currentTournament.name,
      date: state.currentTournament.date,
      month: state.currentTournament.month,
      year: state.currentTournament.year,
      results,
    }
    
    setState(prev => ({
      ...prev,
      history: [...(prev.history || []), historyEntry],
      currentTournament: null,
      currentMatchIndexA: 0,
      currentMatchIndexB: 0,
      timerSecondsA: 0,
      timerSecondsB: 0,
      timerRunningA: false,
      timerRunningB: false,
    }))
    
    toast.success('Tournament archived to history')
  }

  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // MobileNav inlined to prevent re-mounting on every render

  return (
    <div className="min-h-screen bg-[#0a1017] text-white">
      <Toaster theme="dark" position="top-center" />

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col fixed h-full bg-[#0f1a24] border-r border-white/5 transition-all duration-300 z-20 ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}`}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
              <RenbuLogo size={32} glow />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-xl" style={{ fontFamily: '"sicyubi-fudegyosho", "Yuji Syuku", serif' }}>試合場</h1>
                <p className="text-xs text-[#6b8fad]">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[#1a2d42] border border-[#1e3a5f] rounded-full flex items-center justify-center hover:bg-[#243a52] transition z-10"
        >
          <ChevronLeft className={`w-3 h-3 text-[#8fb3d1] transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {!sidebarCollapsed && (
          <div className="p-4 border-b border-white/5">
            <div className="bg-[#142130] border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6b8fad] uppercase tracking-wider">Session</span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{state.members.filter(m => m.isParticipating).length}</span>
                <span className="text-[#6b8fad] text-sm">participating</span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 py-4 overflow-y-auto">
          {!sidebarCollapsed && <p className="px-4 mb-2 text-xs text-[#6b8fad] uppercase tracking-wider">Menu</p>}
          {(() => {
            // Determine upcoming month indicator
            const now = new Date()
            const dayOfMonth = now.getDate()
            const isFirstTwoWeeks = dayOfMonth <= 14
            const currentMonth = MONTHS[now.getMonth()]
            const currentYear = now.getFullYear()
            const nextMonth = MONTHS[(now.getMonth() + 1) % 12]
            const nextYear = now.getMonth() === 11 ? currentYear + 1 : currentYear
            
            // Check if current month has results
            const hasCurrentMonthResults = (state.history || []).some(h => 
              h.month === currentMonth && h.year === currentYear
            ) || (state.currentTournament?.month === currentMonth && state.currentTournament?.year === currentYear)
            
            // Upcoming is next month if: past first 2 weeks OR current month already has results
            const upcomingMonth = (!isFirstTwoWeeks || hasCurrentMonthResults) ? nextMonth : currentMonth
            const upcomingYear = (!isFirstTwoWeeks || hasCurrentMonthResults) ? nextYear : currentYear
            
            const tournamentBadge = state.currentTournament?.status === 'in_progress' 
              ? 'Live' 
              : (state.currentTournament?.month === upcomingMonth && state.currentTournament?.year === upcomingYear)
                ? upcomingMonth.slice(0, 3)
                : null
            
            return [
              { id: 'members', icon: Users, label: 'Members', badge: null },
              { id: 'guests', icon: UserPlus, label: 'Guests', badge: null },
              { id: 'groups', icon: Filter, label: 'Groups', badge: null },
              { id: 'tournament', icon: Trophy, label: 'Tournament', badge: tournamentBadge, badgeColor: state.currentTournament?.status === 'in_progress' ? 'green' : 'amber' },
              { id: 'standings', icon: Table, label: 'Standings', badge: null },
              { id: 'history', icon: History, label: 'History', badge: null },
              { id: 'settings', icon: Settings, label: 'Settings', badge: null },
            ]
          })().map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                activeTab === item.id 
                  ? 'text-orange-400 bg-gradient-to-r from-orange-500/10 to-transparent border-l-2 border-orange-500' 
                  : 'text-[#8fb3d1] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${activeTab === item.id ? 'bg-orange-500/20' : 'bg-[#1a2d42]'}`}>
                <item.icon className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <span className={`ml-auto px-2 py-0.5 text-xs rounded-full border ${
                      item.badgeColor === 'green' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>{item.badge}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={onSwitchPortal}
            className={`w-full py-3 px-4 text-sm bg-gradient-to-r from-[#1e3a5f] to-[#162d4a] hover:from-[#2a4a6f] hover:to-[#1e3a5f] rounded-xl flex items-center justify-center gap-2 font-medium transition ${sidebarCollapsed ? 'px-0' : ''}`}
          >
            <ArrowLeftRight className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span>Courtkeeper</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#0f1a24] border-b border-white/5 flex items-center justify-between px-4 z-30 md:hidden">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <button className="p-2 text-[#8fb3d1] hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-[#0f1a24] border-[#162d4a] w-72 p-0">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                  <RenbuLogo size={32} glow />
                </div>
                <div>
                  <h1 className="font-bold text-white text-lg" style={{ fontFamily: '"sicyubi-fudegyosho", "Yuji Syuku", serif' }}>試合場</h1>
                  <p className="text-xs text-[#6b8fad]">Admin Portal</p>
                </div>
              </div>
            </div>
            <nav className="py-4">
              {[
                { id: 'members', icon: Users, label: 'Members' },
                { id: 'guests', icon: UserPlus, label: 'Guests' },
                { id: 'groups', icon: Filter, label: 'Groups' },
                { id: 'tournament', icon: Trophy, label: 'Tournament' },
                { id: 'standings', icon: Table, label: 'Standings' },
                { id: 'history', icon: History, label: 'History' },
                { id: 'settings', icon: Settings, label: 'Settings' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileNavOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 ${
                    activeTab === item.id 
                      ? 'text-orange-400 bg-orange-500/10 border-l-2 border-orange-500' 
                      : 'text-[#8fb3d1] hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-white/5">
              <button 
                onClick={() => { setMobileNavOpen(false); onSwitchPortal(); }}
                className="w-full py-3 px-4 text-sm bg-gradient-to-r from-[#1e3a5f] to-[#162d4a] rounded-xl flex items-center justify-center gap-2 font-medium text-white"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Courtkeeper</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center">
            <RenbuLogo size={28} glow />
          </div>
          <span className="font-semibold text-lg" style={{ fontFamily: '"sicyubi-fudegyosho", "Yuji Syuku", serif' }}>試合場</span>
        </div>
        <button 
          onClick={async () => {
            const saved = await loadFromStorage()
            if (saved) {
              setState(prev => ({ 
                ...prev, 
                ...saved,
                currentTournament: sanitizeTournament(saved.currentTournament)
              }))
              toast.success('Synced')
            }
          }}
          className="p-2 text-[#8fb3d1] hover:text-white"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className={`pt-14 md:pt-0 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64'}`}>
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[#6b8fad] text-sm mb-1 hidden md:block">Welcome back</p>
              <h2 className="text-xl md:text-2xl font-bold capitalize">{activeTab}</h2>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#6b8fad]" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 bg-[#1e3a5f]/30 border border-[#1e3a5f]/50 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <button 
                onClick={async () => {
                  const saved = await loadFromStorage()
                  if (saved) {
                    const tournament = sanitizeTournament(saved.currentTournament)
                    setState(prev => ({ ...prev, members: saved.members || prev.members, groups: saved.groups || prev.groups, guestRegistry: saved.guestRegistry || prev.guestRegistry, currentTournament: tournament, history: saved.history || prev.history }))
                    toast.success('Synced')
                  }
                }}
                className="p-2.5 text-[#8fb3d1] hover:text-white hover:bg-[#1a2d42] rounded-xl transition"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-[#142130] border border-white/5 rounded-xl p-4">
                  <p className="text-[#6b8fad] text-xs mb-1">Total Members</p>
                  <p className="text-2xl font-bold">{state.members.length}</p>
                </div>
                <div className="bg-[#142130] border border-white/5 rounded-xl p-4">
                  <p className="text-[#6b8fad] text-xs mb-1">Participating</p>
                  <p className="text-2xl font-bold text-green-400">{state.members.filter(m => m.isParticipating).length}</p>
                </div>
                <div className="bg-[#142130] border border-white/5 rounded-xl p-4">
                  <p className="text-[#6b8fad] text-xs mb-1">Matches</p>
                  <p className="text-2xl font-bold">{state.currentTournament?.matches?.length || 0}</p>
                </div>
                <div className="bg-[#142130] border border-white/5 rounded-xl p-4">
                  <p className="text-[#6b8fad] text-xs mb-1">Completed</p>
                  <p className="text-2xl font-bold text-orange-400">{state.currentTournament?.matches?.filter(m => m.status === 'completed').length || 0}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-[#142130] border border-white/5 rounded-xl p-4">
                <div className="flex flex-wrap gap-2">
                  <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                    <DialogTrigger asChild>
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <Plus className="w-4 h-4 mr-2" />Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#142130] border-[#162d4a]">
                      <DialogHeader>
                        <DialogTitle className="text-white">Add Member</DialogTitle>
                      </DialogHeader>
                      <AddMemberForm groups={state.groups} onAdd={addMember} />
                    </DialogContent>
                  </Dialog>
                  <Dialog open={showBulkAdd} onOpenChange={setShowBulkAdd}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-[#1e3a5f] text-[#b8d4ec]">
                        <Upload className="w-4 h-4 mr-2" />Import CSV
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#142130] border-[#162d4a]">
                      <DialogHeader>
                        <DialogTitle className="text-white">Import Members</DialogTitle>
                        <DialogDescription className="text-[#8fb3d1]">Paste CSV: FirstName,LastName,Group</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <textarea 
                          className="w-full h-32 bg-[#1a2d42] border border-[#1e3a5f] rounded-lg p-3 text-sm"
                          placeholder="FirstName,LastName,Group&#10;John,Doe,Group A"
                          id="csv-input"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowBulkAdd(false)} className="border-[#1e3a5f]">Cancel</Button>
                          <Button onClick={() => { 
                            const textarea = document.getElementById('csv-input') as HTMLTextAreaElement
                            if (textarea) { handleCSVImport(textarea.value); setShowBulkAdd(false); }
                          }} className="bg-orange-600 hover:bg-orange-700">Import</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                  <span className="text-xs text-[#6b8fad] self-center">Quick select:</span>
                  {state.groups.map(g => (
                    <button key={g.id} onClick={() => selectByGroup(g.id)} className="px-3 py-1 text-xs rounded-lg bg-[#1a2d42] text-[#8fb3d1] hover:bg-[#243a52]">
                      +{g.name}
                    </button>
                  ))}
                  <button onClick={deselectAll} className="px-3 py-1 text-xs rounded-lg text-[#6b8fad] hover:text-[#b8d4ec]">Clear</button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button 
                  onClick={() => setFilterGroup('all')}
                  className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap ${filterGroup === 'all' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-[#1a2d42] text-[#8fb3d1]'}`}
                >All</button>
                {state.groups.map(g => (
                  <button 
                    key={g.id}
                    onClick={() => setFilterGroup(g.id)}
                    className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap ${filterGroup === g.id ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-[#1a2d42] text-[#8fb3d1]'}`}
                  >{g.name}</button>
                ))}
              </div>

              {/* Members List */}
              <div className="bg-[#142130] border border-white/5 rounded-xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  {filteredMembers.map(member => {
                    const group = getGroupById(member.group)
                    return (
                      <div key={member.id} className="px-4 py-3 flex items-center gap-3 hover:bg-white/5">
                        <Checkbox 
                          checked={member.isParticipating} 
                          onCheckedChange={() => toggleParticipation(member.id)}
                          className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{member.lastName}, {member.firstName}</p>
                          <p className="text-xs text-[#6b8fad]">{group?.name || member.group}{member.isGuest && ' • Guest'}</p>
                        </div>
                        <span className={`w-2 h-2 rounded-full ${member.isParticipating ? 'bg-green-500' : 'bg-[#2e4a65]'}`}></span>
                        <button onClick={() => deleteMember(member.id)} className="p-1.5 text-[#6b8fad] hover:text-red-400 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
                <div className="px-4 py-3 border-t border-white/5 flex justify-between text-sm text-[#6b8fad]">
                  <span>{filteredMembers.length} members</span>
                  <span className="text-orange-400">{state.members.filter(m => m.isParticipating).length} participating</span>
                </div>
              </div>

            </div>
          )}

          {/* Guests Tab */}
          {activeTab === 'guests' && (
            <GuestsTab state={state} onAddGuest={addGuestMember} getGroupById={getGroupById} />
          )}

          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <GroupsManager state={state} setState={setState} />
          )}

          {/* Tournament Tab */}
          {activeTab === 'tournament' && (
            <TournamentManager state={state} setState={setState} getMemberById={getMemberById} getGroupById={getGroupById} generateTournament={generateTournament} refreshTournamentParticipants={refreshTournamentParticipants} archiveTournament={archiveTournament} />
          )}

          {/* Standings Tab */}
          {activeTab === 'standings' && (
            <StandingsView state={state} getMemberById={getMemberById} getGroupById={getGroupById} />
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <HistoryView state={state} setState={setState} />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card className="bg-[#142130] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Display Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <div>
                      <p className="font-medium">First Names Only</p>
                      <p className="text-sm text-[#6b8fad]">Show first names only (disambiguate with last initial when needed)</p>
                    </div>
                    <Switch 
                      checked={state.useFirstNamesOnly}
                      onCheckedChange={(checked) => setState(prev => ({ ...prev, useFirstNamesOnly: checked }))}
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#142130] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Developer Tools</CardTitle>
                  <CardDescription className="text-[#6b8fad]">Test data and debugging options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => {
                      const testMembers: Member[] = []
                      const firstNames = ['Sakura', 'Yuki', 'Hana', 'Ren', 'Kai', 'Aoi', 'Sora', 'Hiro']
                      const lastNames = ['Tanaka', 'Suzuki', 'Yamada', 'Sato', 'Watanabe', 'Ito', 'Takahashi', 'Nakamura']
                      for (let i = 0; i < 20; i++) {
                        testMembers.push({ 
                          id: generateId(), 
                          firstName: firstNames[i % firstNames.length], 
                          lastName: lastNames[i % lastNames.length] + (i > 7 ? (i - 7).toString() : ''), 
                          group: state.groups[i % state.groups.length]?.id || 'group-a', 
                          isGuest: false, 
                          isParticipating: true 
                        })
                      }
                      setState(prev => ({ ...prev, members: [...prev.members, ...testMembers] }))
                      toast.success('Added 20 test members')
                    }} className="px-4 py-3 rounded-xl bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/50 transition">
                      <Plus className="w-4 h-4 inline mr-2" />Add Test Members
                    </button>
                    
                    <button onClick={() => {
                      // Generate demo history
                      const demoHistory: TournamentHistory[] = []
                      const months = ['November', 'October', 'September', 'August', 'July']
                      const players = ['Sakura T.', 'Yuki S.', 'Hana Y.', 'Ren W.', 'Kai I.', 'Aoi N.']
                      
                      months.forEach((month, idx) => {
                        const year = 2025
                        demoHistory.push({
                          id: generateId(),
                          name: `Renbu Monthly Shiai - ${month} ${year}`,
                          date: `${year}-${String(11 - idx).padStart(2, '0')}-15`,
                          month,
                          year,
                          results: [
                            {
                              groupId: 'demo-a',
                              groupName: 'Group A',
                              isNonBogu: false,
                              standings: players.slice(0, 5).map((name, i) => ({
                                rank: i + 1,
                                playerName: name,
                                points: Math.max(0, 10 - i * 2 + Math.floor(Math.random() * 2)),
                                wins: Math.max(0, 4 - i + Math.floor(Math.random() * 2)),
                                losses: i + Math.floor(Math.random() * 2),
                                draws: Math.floor(Math.random() * 2),
                              }))
                            },
                            {
                              groupId: 'demo-b',
                              groupName: 'Group B', 
                              isNonBogu: false,
                              standings: players.slice(1, 6).map((name, i) => ({
                                rank: i + 1,
                                playerName: name,
                                points: Math.max(0, 8 - i * 2 + Math.floor(Math.random() * 2)),
                                wins: Math.max(0, 3 - i + Math.floor(Math.random() * 2)),
                                losses: i + Math.floor(Math.random() * 2),
                                draws: Math.floor(Math.random() * 2),
                              }))
                            }
                          ]
                        })
                      })
                      setState(prev => ({ ...prev, history: [...(prev.history || []), ...demoHistory] }))
                      toast.success('Added 5 months of demo history')
                    }} className="px-4 py-3 rounded-xl bg-blue-900/30 text-blue-400 border border-blue-800/50 hover:bg-blue-900/50 transition">
                      <History className="w-4 h-4 inline mr-2" />Generate Demo History
                    </button>
                    
                    <button onClick={() => setShowClearConfirm(true)} className="px-4 py-3 rounded-xl bg-red-900/30 text-red-400 border border-red-800/50 hover:bg-red-900/50 transition">
                      <Trash2 className="w-4 h-4 inline mr-2" />Clear All Members
                    </button>
                    
                    <button onClick={() => {
                      setState(prev => ({ ...prev, history: [] }))
                      toast.success('History cleared')
                    }} className="px-4 py-3 rounded-xl bg-red-900/30 text-red-400 border border-red-800/50 hover:bg-red-900/50 transition">
                      <Trash2 className="w-4 h-4 inline mr-2" />Clear History
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#142130] border-white/5">
                <CardHeader>
                  <CardTitle className="text-white">Data Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={async () => {
                        const saved = await loadFromStorage()
                        if (saved) {
                          const tournament = sanitizeTournament(saved.currentTournament)
                          setState(prev => ({ ...prev, members: saved.members || prev.members, groups: saved.groups || prev.groups, guestRegistry: saved.guestRegistry || prev.guestRegistry, currentTournament: tournament, history: saved.history || prev.history }))
                          toast.success('Data synced from cloud')
                        }
                      }}
                      className="px-4 py-3 rounded-xl bg-[#1e3a5f] text-[#b8d4ec] border border-[#2a4a6f] hover:bg-[#243a52] transition"
                    >
                      <RefreshCw className="w-4 h-4 inline mr-2" />Sync from Cloud
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Clear Confirm Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="bg-[#142130] border-[#162d4a]">
          <DialogHeader>
            <DialogTitle className="text-white">Clear All Members?</DialogTitle>
            <DialogDescription className="text-[#8fb3d1]">This will remove all {state.members.length} members.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)} className="border-[#1e3a5f]">Cancel</Button>
            <Button variant="destructive" onClick={clearAllMembers}>Clear All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


// Guests Tab Component
function GuestsTab({ state, onAddGuest, getGroupById }: {
  state: AppState
  onAddGuest: (firstName: string, lastName: string, group: string, guestDojo?: string) => void
  getGroupById: (id: string) => Group | undefined
}) {
  const [showAddGuest, setShowAddGuest] = useState(false)
  const guests = state.members.filter(m => m.isGuest)

  return (
    <div className="space-y-4">
      <div className="bg-[#142130] border border-white/5 rounded-xl p-4">
        <Dialog open={showAddGuest} onOpenChange={setShowAddGuest}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a5f] hover:bg-[#162d4a]">
              <Plus className="w-4 h-4 mr-2" />Add Guest
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#142130] border-[#162d4a]">
            <DialogHeader>
              <DialogTitle className="text-white">Add Guest</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label className="text-[#b8d4ec]">First Name</Label>
                          <Input id="guest-first" className="bg-[#1a2d42] border-[#1e3a5f]" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#b8d4ec]">Last Name</Label>
                          <Input id="guest-last" className="bg-[#1a2d42] border-[#1e3a5f]" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#b8d4ec]">Group</Label>
                          <Select defaultValue={state.groups[0]?.id}>
                            <SelectTrigger className="bg-[#1a2d42] border-[#1e3a5f]"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#1a2d42] border-[#1e3a5f]">
                              {state.groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#b8d4ec]">Dojo (optional)</Label>
                          <Input id="guest-dojo" className="bg-[#1a2d42] border-[#1e3a5f]" placeholder="Guest's home dojo" />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="outline" onClick={() => setShowAddGuest(false)} className="border-[#1e3a5f]">Cancel</Button>
                          <Button onClick={() => {
                            const first = (document.getElementById('guest-first') as HTMLInputElement)?.value
                            const last = (document.getElementById('guest-last') as HTMLInputElement)?.value
                            const dojo = (document.getElementById('guest-dojo') as HTMLInputElement)?.value
                            if (first && last) { onAddGuest(first, last, state.groups[0]?.id || '', dojo); setShowAddGuest(false); }
                          }} className="bg-[#1e3a5f] hover:bg-[#162d4a]">Add Guest</Button>
                        </div>
                      </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-[#142130] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <span className="font-medium">Guests ({guests.length})</span>
        </div>
        <div className="divide-y divide-white/5">
          {guests.length === 0 ? (
            <div className="p-8 text-center text-[#6b8fad]">No guests added yet</div>
          ) : (
            guests.map(guest => {
              const group = getGroupById(guest.group)
              return (
                <div key={guest.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{guest.lastName}, {guest.firstName}</p>
                    <p className="text-xs text-[#6b8fad]">{guest.guestDojo || 'Guest'} • {group?.name}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {state.guestRegistry.length > 0 && (
        <div className="bg-[#142130] border border-white/5 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <span className="font-medium">Guest Registry ({state.guestRegistry.length})</span>
          </div>
          <div className="divide-y divide-white/5">
            {state.guestRegistry.map(guest => (
              <div key={guest.id} className="px-4 py-3 text-sm">
                {guest.lastName}, {guest.firstName} {guest.guestDojo && `(${guest.guestDojo})`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Groups Manager Component
function GroupsManager({
  state,
  setState,
}: {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
}) {
  const [editMode, setEditMode] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null)

  const updateGroup = (groupId: string, updates: Partial<Group>) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === groupId ? { ...g, ...updates } : g)
    }))
  }

  const moveGroupPosition = (groupId: string, direction: 'up' | 'down') => {
    setState(prev => {
      const groups = [...prev.groups]
      const idx = groups.findIndex(g => g.id === groupId)
      if (idx === -1) return prev
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= groups.length) return prev
      ;[groups[idx], groups[newIdx]] = [groups[newIdx], groups[idx]]
      return { ...prev, groups }
    })
  }

  const reorderGroups = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return
    setState(prev => {
      const groups = [...prev.groups]
      const draggedIdx = groups.findIndex(g => g.id === draggedId)
      const targetIdx = groups.findIndex(g => g.id === targetId)
      if (draggedIdx === -1 || targetIdx === -1) return prev
      const [dragged] = groups.splice(draggedIdx, 1)
      groups.splice(targetIdx, 0, dragged)
      return { ...prev, groups }
    })
  }

  const addGroup = () => {
    if (!newGroupName.trim()) {
      toast.error('Enter a group name')
      return
    }
    const newGroup: Group = {
      id: generateId(),
      name: newGroupName.trim(),
      isNonBogu: false,
    }
    setState(prev => ({ ...prev, groups: [...prev.groups, newGroup] }))
    setNewGroupName('')
    toast.success('Group added')
  }

  const deleteGroup = (groupId: string) => {
    const membersInGroup = state.members.filter(m => m.group === groupId).length
    if (membersInGroup > 0) {
      toast.error(`Cannot delete: ${membersInGroup} members in this group`)
      return
    }
    setState(prev => ({ ...prev, groups: prev.groups.filter(g => g.id !== groupId) }))
    toast.success('Group deleted')
  }

  return (
    <div className="space-y-3">
      <Card className="bg-[#142130] border-white/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">Groups</CardTitle>
            <Button
              size="sm"
              variant={editMode ? "default" : "outline"}
              onClick={() => setEditMode(!editMode)}
              className={editMode ? "bg-orange-600 hover:bg-orange-700" : "border-[#2a4a6f]"}
            >
              <Edit2 className="w-3 h-3 mr-1" />
              {editMode ? 'Done' : 'Edit'}
            </Button>
          </div>
          <CardDescription className="text-[#8fb3d1] text-xs">
            Odd positions → Court A (amber) | Even → Court B (blue)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {editMode && (
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="New group..."
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                className="bg-[#1a2d42] border-[#2a4a6f] text-sm h-9"
              />
              <Button onClick={addGroup} size="sm" className="bg-orange-600 hover:bg-orange-700 h-9">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="space-y-1">
            {state.groups.map((group, idx) => {
              const memberCount = state.members.filter(m => m.group === group.id).length
              const isCourtA = idx % 2 === 0
              const isDragging = draggedGroupId === group.id
              const isDragTarget = draggedGroupId && draggedGroupId !== group.id
              
              return (
                <div 
                  key={group.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedGroupId(group.id)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragEnd={() => setDraggedGroupId(null)}
                  onDragOver={(e) => {
                    if (!isDragTarget) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedGroupId && isDragTarget) {
                      reorderGroups(draggedGroupId, group.id)
                    }
                    setDraggedGroupId(null)
                  }}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-all cursor-grab active:cursor-grabbing select-none ${
                    isDragging ? 'opacity-50 scale-95' :
                    isDragTarget ? 'border-2 border-dashed border-amber-400/50' :
                    isCourtA 
                      ? 'bg-amber-950/20 border-l-2 border-l-amber-500' 
                      : 'bg-blue-950/20 border-l-2 border-l-blue-500'
                  }`}
                >
                  {/* Drag handle */}
                  <span className="text-slate-500 cursor-grab">☰</span>
                  {/* Court badge */}
                  <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                    isCourtA ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
                  }`}>
                    {isCourtA ? 'A' : 'B'}
                  </span>
                  
                  {/* Group info */}
                  {editingGroup?.id === group.id ? (
                    <Input
                      value={editingGroup.name}
                      onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                      className="bg-[#1e3a5f] border-[#2a4a6f] flex-1 h-8 text-sm"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          updateGroup(group.id, { name: editingGroup.name })
                          setEditingGroup(null)
                        }
                        if (e.key === 'Escape') setEditingGroup(null)
                      }}
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-sm font-medium">{group.name}</span>
                      <span className="text-[#6b8fad] text-xs ml-1">({memberCount})</span>
                    </div>
                  )}
                  
                  {/* Non-bogu toggle */}
                  <div className="flex items-center gap-1">
                    {group.isNonBogu && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">Hantei</span>
                    )}
                    {editMode && (
                      <Switch
                        checked={group.isNonBogu}
                        onCheckedChange={(checked) => updateGroup(group.id, { isNonBogu: checked })}
                        className="scale-75"
                      />
                    )}
                  </div>
                  
                  {/* Edit/Delete buttons - only in edit mode */}
                  {editMode && (
                    <div className="flex gap-0.5">
                      {editingGroup?.id === group.id ? (
                        <>
                          <button
                            onClick={() => {
                              updateGroup(group.id, { name: editingGroup.name })
                              setEditingGroup(null)
                            }}
                            className="p-1.5 rounded text-green-400 hover:bg-green-900/30"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingGroup(null)}
                            className="p-1.5 rounded text-slate-400 hover:bg-slate-700/30"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingGroup(group)}
                            className="p-1.5 rounded text-slate-400 hover:bg-slate-700/30"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteGroup(group.id)}
                            className="p-1.5 rounded text-red-400 hover:bg-red-900/30"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#142130] border-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base">Rules</CardTitle>
        </CardHeader>
        <CardContent className="text-[#b8d4ec] text-xs space-y-2">
          <div>
            <span className="font-semibold text-white">Bogu:</span> First to 2 ippons wins, 3 min, draws allowed
          </div>
          <div>
            <span className="font-semibold text-orange-400">Hantei:</span> Judge decision, no ippons, no draws
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


function TournamentManager({
  state,
  setState,
  getMemberById,
  getGroupById,
  generateTournament,
  refreshTournamentParticipants,
  archiveTournament,
}: {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  getMemberById: (id: string) => Member | undefined
  getGroupById: (id: string) => Group | undefined
  generateTournament: (month: string, year: number, date: string) => void
  refreshTournamentParticipants: () => void
  archiveTournament: () => void
}) {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const tournament = state.currentTournament

  const startTournament = () => {
    if (!tournament) return
    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, status: 'in_progress' }
    }))
    toast.success('Tournament started!')
  }

  const clearTournament = () => {
    setState(prev => ({
      ...prev,
      currentTournament: null,
      currentMatchIndexA: 0,
      currentMatchIndexB: 0,
      timerSecondsA: 0,
      timerSecondsB: 0,
      timerRunningA: false,
      timerRunningB: false,
    }))
    toast.success('Tournament cleared')
  }

  const swapMatchCourt = (matchId: string) => {
    if (!tournament) return
    setState(prev => ({
      ...prev,
      currentTournament: {
        ...tournament,
        matches: (tournament.matches || []).map(m => 
          m.id === matchId ? { ...m, court: m.court === 'A' ? 'B' : 'A' } : m
        )
      }
    }))
  }

  const setGroupCourt = (groupId: string, court: 'A' | 'B') => {
    if (!tournament) return
    // Remove from shared groups when assigning to specific court
    setState(prev => ({
      ...prev,
      sharedGroups: prev.sharedGroups.filter(g => g !== groupId),
      currentTournament: {
        ...tournament,
        matches: (tournament.matches || []).map(m => 
          m.groupId === groupId ? { ...m, court } : m
        )
      }
    }))
    toast.success(`All ${getGroupById(groupId)?.name || 'group'} matches moved to Court ${court}`)
  }

  const toggleSharedGroup = (groupId: string) => {
    const isCurrentlyShared = state.sharedGroups.includes(groupId)
    if (isCurrentlyShared) {
      // Remove from shared - assign all to Court A
      setState(prev => ({
        ...prev,
        sharedGroups: prev.sharedGroups.filter(g => g !== groupId),
        currentTournament: {
          ...tournament!,
          matches: (tournament!.matches || []).map(m => 
            m.groupId === groupId && m.status === 'pending' ? { ...m, court: 'A' } : m
          )
        }
      }))
      toast.success(`${getGroupById(groupId)?.name} now on Court A only`)
    } else {
      // Add to shared groups
      setState(prev => ({
        ...prev,
        sharedGroups: [...prev.sharedGroups, groupId]
      }))
      toast.success(`${getGroupById(groupId)?.name} shared between both courts`)
    }
  }

  // Update individual match settings (timer, match type)
  const updateMatchSettings = (matchId: string, field: string, value: number | string) => {
    if (!tournament) return
    setState(prev => ({
      ...prev,
      currentTournament: {
        ...tournament,
        matches: (tournament.matches || []).map(m => 
          m.id === matchId ? { ...m, [field]: value } : m
        )
      }
    }))
  }

  // Update all matches in a group with same settings
  const setGroupMatchSettings = (groupId: string, field: string, value: number | string) => {
    if (!tournament) return
    setState(prev => ({
      ...prev,
      currentTournament: {
        ...tournament,
        matches: (tournament.matches || []).map(m => 
          m.groupId === groupId ? { ...m, [field]: value } : m
        )
      }
    }))
    toast.success(`Updated ${field} for all ${getGroupById(groupId)?.name || 'group'} matches`)
  }

  // Track dragged group in tournament
  const [draggedTournamentGroupId, setDraggedTournamentGroupId] = useState<string | null>(null)

  // Reorder groups in tournament
  const moveGroupOrder = (groupId: string, direction: 'up' | 'down') => {
    if (!tournament || !tournament.groupOrder) return
    const currentOrder = [...tournament.groupOrder]
    const idx = currentOrder.indexOf(groupId)
    if (idx === -1) return
    
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= currentOrder.length) return
    
    // Swap
    [currentOrder[idx], currentOrder[newIdx]] = [currentOrder[newIdx], currentOrder[idx]]
    
    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, groupOrder: currentOrder }
    }))
  }

  const reorderTournamentGroups = (draggedId: string, targetId: string) => {
    if (!tournament || !tournament.groupOrder || draggedId === targetId) return
    const currentOrder = [...tournament.groupOrder]
    const draggedIdx = currentOrder.indexOf(draggedId)
    const targetIdx = currentOrder.indexOf(targetId)
    if (draggedIdx === -1 || targetIdx === -1) return
    currentOrder.splice(draggedIdx, 1)
    currentOrder.splice(targetIdx, 0, draggedId)
    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, groupOrder: currentOrder }
    }))
  }

    if (!tournament || !tournament.groupOrder) {
    return (
      <Card className="bg-[#142130] border-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Tournament Setup</CardTitle>
          <CardDescription className="text-[#b8d4ec]">
            Generate a round-robin tournament. You can generate before selecting participants, then refresh to add them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#b8d4ec]">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="bg-[#243a52]/50 border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#243a52]/50 border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                  {MONTHS.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#b8d4ec]">Year</Label>
              <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="bg-[#243a52]/50 border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#243a52]/50 border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#b8d4ec]">Date</Label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#142130] border-[#2a4a6f] text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1e3a5f]/30 rounded-xl p-4 text-center border border-white/5">
              <div className="text-3xl font-bold text-white">{state.members.length}</div>
              <div className="text-sm text-[#b8d4ec]">Total Members</div>
            </div>
            <div className="bg-[#1e3a5f]/30 rounded-xl p-4 text-center border border-white/5">
              <div className="text-3xl font-bold text-orange-400">
                {state.members.filter(m => m.isParticipating).length}
              </div>
              <div className="text-sm text-[#b8d4ec]">Participating</div>
            </div>
            <div className="bg-[#1e3a5f]/30 rounded-xl p-4 text-center border border-white/5">
              <div className="text-3xl font-bold text-white">{state.groups.length}</div>
              <div className="text-sm text-[#b8d4ec]">Groups</div>
            </div>
            <div className="bg-[#1e3a5f]/30 rounded-xl p-4 text-center border border-white/5">
              <div className="text-3xl font-bold text-emerald-400">
                {(() => {
                  const participants = state.members.filter(m => m.isParticipating)
                  const byGroup = new Map<string, number>()
                  participants.forEach(p => byGroup.set(p.group, (byGroup.get(p.group) || 0) + 1))
                  let total = 0
                  byGroup.forEach(count => total += (count * (count - 1)) / 2)
                  return total
                })()}
              </div>
              <div className="text-sm text-[#b8d4ec]">Est. Matches</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-medium">Participants by Group:</h4>
            <div className="flex flex-wrap gap-2">
              {state.groups.map(g => {
                const count = state.members.filter(m => m.group === g.id && m.isParticipating).length
                return (
                  <Badge 
                    key={g.id} 
                    variant="outline" 
                    className={`${g.isNonBogu ? 'border-orange-500 text-orange-400' : 'border-[#2a4a6f] text-[#b8d4ec]'}`}
                  >
                    {g.name}: {count}
                  </Badge>
                )
              })}
            </div>
          </div>

          <Button 
            onClick={() => generateTournament(selectedMonth, selectedYear, selectedDate)}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Generate Tournament
          </Button>
        </CardContent>
      </Card>
    )
  }

  const completedMatches = (tournament.matches || []).filter(m => m.status === 'completed').length
  const totalMatches = (tournament.matches || []).length
  const isComplete = totalMatches > 0 && completedMatches === totalMatches
  const courtAMatches = (tournament.matches || []).filter(m => m.court === 'A')
  const courtBMatches = (tournament.matches || []).filter(m => m.court === 'B')

  return (
    <div className="space-y-4">
      <Card className="bg-[#142130] border-white/5 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-white text-lg sm:text-xl">{tournament.name}</CardTitle>
              <CardDescription className="text-[#8fb3d1] text-sm">
                {tournament.month} {tournament.year}
              </CardDescription>
            </div>
            <Badge className={`text-sm px-3 py-1 ${
              tournament.status === 'setup' ? 'bg-yellow-600' :
              tournament.status === 'in_progress' ? (isComplete ? 'bg-emerald-600' : 'bg-amber-500') :
              'bg-emerald-600'
            }`}>
              {tournament.status === 'setup' ? 'Setup' : tournament.status === 'in_progress' ? (isComplete ? 'Complete!' : 'In Progress') : 'Completed'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${(completedMatches / totalMatches) * 100}%` }}
              />
            </div>
            <span className="text-[#b8d4ec] text-sm">{completedMatches}/{totalMatches} matches</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-amber-400">{courtAMatches.length}</div>
              <div className="text-xs sm:text-sm text-[#8fb3d1]">Court A</div>
            </div>
            <div className="bg-[#243a52]/30 border border-white/5 rounded-lg p-2 sm:p-3 text-center">
              <div className="text-xl sm:text-2xl font-bold text-[#b8d4ec]">{courtBMatches.length}</div>
              <div className="text-xs sm:text-sm text-[#8fb3d1]">Court B</div>
            </div>
          </div>

          {/* Timer Settings */}
          <div className="bg-[#1e3a5f]/20 rounded-lg p-3 border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#b8d4ec]">Timer Options</span>
              <span className="text-xs text-slate-500">Available durations for matches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[60, 90, 120, 150, 180, 240, 300].map(secs => {
                const isSelected = (tournament.timerOptions || [120, 180, 240, 300]).includes(secs)
                return (
                  <button
                    key={secs}
                    onClick={() => {
                      const current = tournament.timerOptions || [120, 180, 240, 300]
                      const newOptions = isSelected 
                        ? current.filter(t => t !== secs)
                        : [...current, secs].sort((a, b) => a - b)
                      if (newOptions.length === 0) return // Don't allow empty
                      setState(prev => ({
                        ...prev,
                        currentTournament: { ...tournament, timerOptions: newOptions }
                      }))
                    }}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      isSelected 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {Math.floor(secs / 60)}:{(secs % 60).toString().padStart(2, '0')}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {tournament.status === 'setup' && (
              <>
                <Button onClick={startTournament} className="bg-emerald-600 hover:bg-emerald-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start Tournament
                </Button>
                <Button onClick={refreshTournamentParticipants} variant="outline" className="border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Participants
                </Button>
              </>
            )}
            {tournament.status === 'in_progress' && !isComplete && (
              <Button onClick={refreshTournamentParticipants} variant="outline" className="h-10 px-4 border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Participants
              </Button>
            )}
            {isComplete && (
              <Button onClick={archiveTournament} className="h-10 px-4 bg-orange-600 hover:bg-orange-700">
                <History className="w-4 h-4 mr-2" />
                Archive & Complete
              </Button>
            )}
            <Button variant="outline" onClick={clearTournament} className="h-10 px-4 border-red-700/60 text-red-400 bg-red-900/20 hover:bg-red-800/40 hover:border-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Tournament
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Match Schedule by Group with Court Assignment */}
      {(tournament.groupOrder || []).map((groupId, gIdx) => {
        const group = getGroupById(groupId)
        const groupMatches = (tournament.matches || []).filter(m => m.groupId === groupId)
        const totalGroups = (tournament.groupOrder || []).length
        const isShared = state.sharedGroups.includes(groupId)
        const isCourtA = !isShared && groupMatches[0]?.court === 'A'
        const isCourtB = !isShared && groupMatches[0]?.court === 'B'
        const isDraggingGroup = draggedTournamentGroupId === groupId
        const isDragTargetGroup = draggedTournamentGroupId && draggedTournamentGroupId !== groupId
        
        return (
          <Card 
            key={groupId} 
            draggable
            onDragStart={(e) => {
              setDraggedTournamentGroupId(groupId)
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragEnd={() => setDraggedTournamentGroupId(null)}
            onDragOver={(e) => {
              if (!isDragTargetGroup) return
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (draggedTournamentGroupId && isDragTargetGroup) {
                reorderTournamentGroups(draggedTournamentGroupId, groupId)
              }
              setDraggedTournamentGroupId(null)
            }}
            className={`border-l-2 transition-all cursor-grab active:cursor-grabbing ${
              isDraggingGroup ? 'opacity-50 scale-[0.98]' :
              isDragTargetGroup ? 'border-2 border-dashed border-amber-400/50' :
              isShared ? 'border-l-emerald-500' : isCourtA ? 'border-l-amber-500' : 'border-l-blue-500'
            }`}
          >
            <CardHeader className="p-3 pb-2">
              {/* Row 1: Group name and progress */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 cursor-grab">☰</span>
                <span className={`px-1.5 h-6 rounded flex items-center justify-center text-xs font-bold ${
                  isShared ? 'bg-emerald-500 text-white' : isCourtA ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
                }`}>
                  {isShared ? 'A+B' : isCourtA ? 'A' : 'B'}
                </span>
                <span className="text-white font-medium text-sm">{group?.name || groupId}</span>
                {group?.isNonBogu && <span className="text-[9px] px-1 py-0.5 bg-orange-900/40 text-orange-300 rounded">Hantei</span>}
                <span className="text-[10px] text-[#6b8fad] ml-auto">{groupMatches.filter(m => m.status === 'completed').length}/{groupMatches.length}</span>
              </div>
              {/* Row 2: Settings */}
              <div className="flex items-center gap-1 mt-1">
                <select
                  value={groupMatches[0]?.timerDuration || 180}
                  onChange={(e) => setGroupMatchSettings(groupId, 'timerDuration', parseInt(e.target.value))}
                  className="bg-[#1a2d42] border border-[#1e3a5f] rounded px-1 py-0.5 text-[10px] text-[#b8d4ec]"
                >
                  {(tournament.timerOptions || [120, 180, 240, 300]).map(secs => (
                    <option key={secs} value={secs}>{Math.floor(secs / 60)}m</option>
                  ))}
                </select>
                <select
                  value={groupMatches[0]?.matchType || 'sanbon'}
                  onChange={(e) => setGroupMatchSettings(groupId, 'matchType', e.target.value)}
                  className="bg-[#1a2d42] border border-[#1e3a5f] rounded px-1 py-0.5 text-[10px] text-[#b8d4ec]"
                >
                  <option value="sanbon">Sanbon</option>
                  <option value="ippon">Ippon</option>
                </select>
                <div className="flex rounded overflow-hidden border border-[#1e3a5f] ml-auto">
                  <button
                    className={`px-2 py-0.5 text-[10px] font-bold ${isCourtA ? 'bg-amber-500 text-black' : 'bg-[#1a2d42] text-[#8fb3d1]'}`}
                    onClick={() => setGroupCourt(groupId, 'A')}
                  >A</button>
                  <button
                    className={`px-2 py-0.5 text-[10px] font-bold ${isShared ? 'bg-emerald-500 text-white' : 'bg-[#1a2d42] text-[#8fb3d1]'}`}
                    onClick={() => toggleSharedGroup(groupId)}
                  >A+B</button>
                  <button
                    className={`px-2 py-0.5 text-[10px] font-bold ${isCourtB ? 'bg-blue-500 text-white' : 'bg-[#1a2d42] text-[#8fb3d1]'}`}
                    onClick={() => setGroupCourt(groupId, 'B')}
                  >B</button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-72 pr-2">
                <div className="space-y-2">
                  {groupMatches.map((match, idx) => {
                    const p1 = getMemberById(match.player1Id)
                    const p2 = getMemberById(match.player2Id)
                    const timerMins = Math.floor((match.timerDuration || 180) / 60)
                    const isIppon = match.matchType === 'ippon'
                    return (
                      <div 
                        key={match.id}
                        className={`p-2 sm:p-3 rounded-lg ${
                          match.status === 'completed' ? 'bg-[#243a52]/20' :
                          match.status === 'in_progress' ? 'bg-emerald-900/20 border border-emerald-700' :
                          'bg-[#142130]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[#6b8fad] text-xs w-5">#{idx + 1}</span>
                          <button
                            className={`w-6 h-6 rounded text-xs font-bold ${match.court === 'A' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'}`}
                            onClick={() => swapMatchCourt(match.id)}
                          >
                            {match.court}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-sm">
                              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                              <span className={`truncate ${match.winner === 'player1' ? 'text-red-400 font-semibold' : 'text-white'}`}>
                                {p1 ? formatDisplayName(p1, state.members, state.useFirstNamesOnly) : '?'}
                              </span>
                              <span className="text-[#6b8fad] mx-1">vs</span>
                              <span className="w-2 h-2 rounded-full bg-white flex-shrink-0"></span>
                              <span className={`truncate ${match.winner === 'player2' ? 'text-blue-100 font-semibold' : 'text-white'}`}>
                                {p2 ? formatDisplayName(p2, state.members, state.useFirstNamesOnly) : '?'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Match settings for pending matches */}
                          {match.status === 'pending' && (
                            <div className="flex items-center gap-1">
                              <select
                                value={match.timerDuration || 180}
                                onChange={(e) => updateMatchSettings(match.id, 'timerDuration', parseInt(e.target.value))}
                                className="bg-[#0f1a24] border border-[#1e3a5f] rounded px-1 py-0.5 text-[10px] text-[#8fb3d1] w-12"
                              >
                                {(tournament.timerOptions || [120, 180, 240, 300]).map(secs => (
                                  <option key={secs} value={secs}>{Math.floor(secs / 60)}m</option>
                                ))}
                              </select>
                              <select
                                value={match.matchType || 'sanbon'}
                                onChange={(e) => updateMatchSettings(match.id, 'matchType', e.target.value)}
                                className="bg-[#0f1a24] border border-[#1e3a5f] rounded px-1 py-0.5 text-[10px] text-[#8fb3d1] w-12"
                              >
                                <option value="sanbon">Sanbon</option>
                                <option value="ippon">Ippon</option>
                              </select>
                            </div>
                          )}
                        </div>
                        
                        {/* Status row */}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-[#6b8fad]">
                            {match.status === 'completed' && match.actualDuration ? 
                              `${Math.floor(match.actualDuration / 60)}:${(match.actualDuration % 60).toString().padStart(2, '0')}` : 
                              `${timerMins}m · ${isIppon ? 'Ippon' : 'Sanbon'}`
                            }
                          </span>
                          {match.status === 'completed' && (
                            <span className={`text-xs px-2 py-0.5 rounded ${match.winner === 'player1' ? 'bg-red-900/30 text-red-400' : match.winner === 'player2' ? 'bg-blue-900/30 text-blue-200' : 'bg-[#1a2d42] text-[#8fb3d1]'}`}>
                              {match.winner === 'draw' ? 'Draw' : 
                               match.winner === 'player1' ? `Win ${match.isHantei ? '(Hantei)' : (match.player1Score?.length || 0) + '-' + (match.player2Score?.length || 0)}` :
                               `Win ${match.isHantei ? '(Hantei)' : (match.player1Score?.length || 0) + '-' + (match.player2Score?.length || 0)}`}
                            </span>
                          )}
                          {match.status === 'in_progress' && (
                            <span className={`text-xs px-2 py-0.5 rounded text-white animate-pulse ${match.court === 'A' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                              Live {match.court}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Standings View Component
function StandingsView({
  state,
  getGroupById,
}: {
  state: AppState
  getMemberById: (id: string) => Member | undefined
  getGroupById: (id: string) => Group | undefined
}) {
  const [selectedGroup, setSelectedGroup] = useState<string>('all')

  if (!state.currentTournament) {
    return (
      <Card className="bg-[#142130] border-white/5 backdrop-blur-sm">
        <CardContent className="p-8 text-center text-[#8fb3d1]">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No tournament in progress</p>
          <p className="text-sm mt-2">Generate a tournament to see standings</p>
        </CardContent>
      </Card>
    )
  }

  const tournamentGroups = state.currentTournament.groups
  const groupsToShow = selectedGroup === 'all' ? tournamentGroups : [selectedGroup]

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedGroup === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedGroup('all')}
          className={selectedGroup === 'all' ? 'bg-amber-600' : 'border-[#1e3a5f]'}
        >
          All Groups
        </Button>
        {tournamentGroups.map(gId => {
          const group = getGroupById(gId)
          return (
            <Button
              key={gId}
              variant={selectedGroup === gId ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedGroup(gId)}
              className={selectedGroup === gId ? 'bg-amber-600' : 'border-[#1e3a5f]'}
            >
              {group?.name || gId}
            </Button>
          )
        })}
      </div>

      {groupsToShow.map(groupId => {
        const group = getGroupById(groupId)
        const standings = calculateStandings(groupId, state.currentTournament!.matches, state.members, state.useFirstNamesOnly)
        const groupMembers = state.members.filter(m => m.group === groupId && m.isParticipating)
        
        if (standings.length === 0) return null

        return (
          <Card key={groupId} className="bg-[#142130] border-white/5 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {group?.name || groupId}
                {group?.isNonBogu && <Badge className="bg-orange-900 text-orange-200">Hantei</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
                      <th className="text-left text-[#b8d4ec] p-2 font-medium">#</th>
                      <th className="text-left text-[#b8d4ec] p-2 font-medium">Name</th>
                      <th className="text-center text-[#b8d4ec] p-2 font-medium">Pts</th>
                      <th className="text-center text-[#b8d4ec] p-2 font-medium">W</th>
                      {!group?.isNonBogu && <th className="text-center text-[#b8d4ec] p-2 font-medium">D</th>}
                      <th className="text-center text-[#b8d4ec] p-2 font-medium">L</th>
                      <th className="text-center text-[#b8d4ec] p-2 font-medium">Left</th>
                      {!group?.isNonBogu && <th className="text-center text-[#b8d4ec] p-2 font-medium">Ippons</th>}
                      {groupMembers.map(m => (
                        <th key={m.id} className="text-center text-[#b8d4ec] p-2 font-medium text-xs">
                          {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing, idx) => (
                      <tr key={standing.playerId} className="border-b border-white/5 hover:bg-[#142130]">
                        <td className="p-2 text-[#8fb3d1]">{idx + 1}</td>
                        <td className="p-2 text-white font-medium">{standing.playerName}</td>
                        <td className="p-2 text-center text-orange-400 font-bold">{standing.points}</td>
                        <td className="p-2 text-center text-green-400">{standing.wins}</td>
                        {!group?.isNonBogu && <td className="p-2 text-center text-[#b8d4ec]">{standing.draws}</td>}
                        <td className="p-2 text-center text-red-400">{standing.losses}</td>
                        <td className="p-2 text-center text-slate-400">{standing.gamesLeft > 0 ? standing.gamesLeft : '-'}</td>
                        {!group?.isNonBogu && (
                          <td className="p-2 text-center text-[#b8d4ec]">
                            {standing.ipponsScored}-{standing.ipponsAgainst}
                          </td>
                        )}
                        {groupMembers.map(m => {
                          if (m.id === standing.playerId) {
                            return <td key={m.id} className="p-2 text-center text-[#4a6a8a]">-</td>
                          }
                          const result = standing.results.get(m.id)
                          let className = 'p-2 text-center '
                          if (result === 'W') className += 'text-green-400 bg-green-900/20'
                          else if (result === 'L') className += 'text-red-400 bg-red-900/20'
                          else if (result === 'D') className += 'text-[#b8d4ec] bg-[#243a52]/50'
                          else className += 'text-[#4a6a8a]'
                          return <td key={m.id} className={className}>{result || '-'}</td>
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// History View Component with Excel Import
function HistoryView({
  state,
  setState,
}: {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
}) {
  const [showImport, setShowImport] = useState(false)
  const history = state.history || []
  
  const deleteHistoryEntry = (id: string) => {
    setState(prev => ({
      ...prev,
      history: (prev.history || []).filter(h => h.id !== id)
    }))
    toast.success('History entry deleted')
  }

  const handleExcelImport = (data: string) => {
    try {
      // Parse CSV/Excel data
      // Expected format: Month,Year,GroupName,Rank,PlayerName,Points,Wins,Losses,Draws
      const lines = data.trim().split('\n')
      const startIdx = lines[0].toLowerCase().includes('month') ? 1 : 0
      
      const entries: Map<string, TournamentHistory> = new Map()
      
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/"/g, ''))
        if (parts.length >= 7) {
          const [month, yearStr, groupName, rankStr, playerName, pointsStr, winsStr, lossesStr, drawsStr] = parts
          const year = parseInt(yearStr)
          const key = `${month}-${year}`
          
          if (!entries.has(key)) {
            entries.set(key, {
              id: generateId(),
              name: `Renbu Monthly Shiai - ${month} ${year}`,
              date: new Date(year, MONTHS.indexOf(month), 1).toISOString().split('T')[0],
              month,
              year,
              results: []
            })
          }
          
          const entry = entries.get(key)!
          let groupResult = entry.results.find(r => r.groupName === groupName)
          if (!groupResult) {
            groupResult = {
              groupId: generateId(),
              groupName,
              isNonBogu: groupName.toLowerCase().includes('non-bogu'),
              standings: []
            }
            entry.results.push(groupResult)
          }
          
          groupResult.standings.push({
            rank: parseInt(rankStr) || groupResult.standings.length + 1,
            playerName,
            points: parseInt(pointsStr) || 0,
            wins: parseInt(winsStr) || 0,
            losses: parseInt(lossesStr) || 0,
            draws: parseInt(drawsStr || '0') || 0,
          })
        }
      }
      
      setState(prev => ({
        ...prev,
        history: [...(prev.history || []), ...entries.values()]
      }))
      
      toast.success(`Imported ${entries.size} tournament(s)`)
      setShowImport(false)
    } catch (e) {
      toast.error('Failed to parse import data')
    }
  }

  if (history.length === 0 && !showImport) {
    return (
      <Card className="bg-[#142130] border-white/5 backdrop-blur-sm">
        <CardContent className="p-8 text-center text-[#8fb3d1]">
          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No tournament history</p>
          <p className="text-sm mt-2">Completed tournaments will appear here</p>
          <Button className="mt-4" variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Past History
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showImport} onOpenChange={setShowImport}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
              <Upload className="w-4 h-4 mr-2" />
              Import Past History
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#142130] border-white/5 backdrop-blur-sm max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Import Tournament History</DialogTitle>
              <DialogDescription className="text-[#b8d4ec]">
                Import past tournament data from CSV/Excel. Format: Month,Year,GroupName,Rank,PlayerName,Points,Wins,Losses,Draws
              </DialogDescription>
            </DialogHeader>
            <HistoryImportForm onImport={handleExcelImport} />
          </DialogContent>
        </Dialog>
      </div>

      {history.map(entry => (
        <Card key={entry.id} className="bg-[#142130] border-white/5 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">{entry.name}</CardTitle>
                <CardDescription className="text-[#b8d4ec]">{entry.date}</CardDescription>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteHistoryEntry(entry.id)}
                className="h-8 w-8 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entry.results.map(result => (
                <div key={result.groupId} className="bg-[#142130] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-white font-medium">{result.groupName}</h4>
                    {result.isNonBogu && <Badge className="bg-orange-900 text-orange-200 text-xs">Hantei</Badge>}
                  </div>
                  <div className="space-y-2">
                    {result.standings.slice(0, 3).map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className={`w-6 text-center font-bold ${
                          idx === 0 ? 'text-orange-400' :
                          idx === 1 ? 'text-[#b8d4ec]' :
                          'text-amber-700'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-white flex-1">{s.playerName}</span>
                        <span className="text-orange-400">{s.points}pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// History Import Form
function HistoryImportForm({ onImport }: { onImport: (data: string) => void }) {
  const [importText, setImportText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImportText(event.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Upload CSV/Excel File</Label>
        <Input
          type="file"
          accept=".csv,.xlsx,.xls"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="bg-[#1a2d42] border-[#2a4a6f] focus:border-orange-500"
        />
      </div>
      <div className="space-y-2">
        <Label>Or paste data</Label>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="w-full h-40 bg-[#243a52]/50 border border-[#1e3a5f] rounded-md p-3 text-white text-sm font-mono"
          placeholder="Month,Year,GroupName,Rank,PlayerName,Points,Wins,Losses,Draws&#10;January,2025,Group A,1,John Doe,6,3,0,0&#10;January,2025,Group A,2,Jane Smith,4,2,1,0"
        />
      </div>
      <DialogFooter>
        <Button 
          onClick={() => onImport(importText)}
          className="bg-orange-600 hover:bg-orange-700"
          disabled={!importText.trim()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>
      </DialogFooter>
    </div>
  )
}

// Add Member Form
function AddMemberForm({ 
  groups,
  onAdd 
}: { 
  groups: Group[]
  onAdd: (firstName: string, lastName: string, group: string) => void 
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [group, setGroup] = useState(groups[0]?.id || '')

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>First Name</Label>
        <Input 
          value={firstName} 
          onChange={(e) => setFirstName(e.target.value)}
          className="bg-[#1a2d42] border-[#2a4a6f] focus:border-orange-500"
          placeholder="Enter first name"
        />
      </div>
      <div className="space-y-2">
        <Label>Last Name</Label>
        <Input 
          value={lastName} 
          onChange={(e) => setLastName(e.target.value)}
          className="bg-[#1a2d42] border-[#2a4a6f] focus:border-orange-500"
          placeholder="Enter last name"
        />
      </div>
      <div className="space-y-2">
        <Label>Group</Label>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="bg-[#243a52]/50 border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent className="bg-[#243a52]/50 border-[#2a4a6f] bg-[#142130] hover:bg-[#1e3a5f]">
            {groups.map(g => (
              <SelectItem key={g.id} value={g.id}>
                {g.name} {g.isNonBogu && '(Hantei)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button 
          onClick={() => onAdd(firstName, lastName, group)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Add Member
        </Button>
      </DialogFooter>
    </div>
  )
}

// Courtkeeper Portal Component - Significantly Enhanced
function CourtkeeperPortal({ 
  state, 
  setState, 
  isMobile: _isMobile,
  onSwitchPortal,
  getMemberById,
  getGroupById
}: { 
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  isMobile: boolean
  onSwitchPortal: () => void
  getMemberById: (id: string) => Member | undefined
  getGroupById: (id: string) => Group | undefined
}) {
  const [selectedCourt, setSelectedCourt] = useState<'A' | 'B'>('A')
  const [lastMatchId, setLastMatchId] = useState<string | null>(null)
  
  const tournament = state.currentTournament
  
  // Shared groups run on both courts - show pending AND in_progress matches
  const sharedGroups = state.sharedGroups || []
  
  // Court matches include: assigned to this court OR shared group (pending/in_progress)
  const courtAMatches = tournament?.matches?.filter(m => 
    m.court === 'A' || (sharedGroups.includes(m.groupId) && m.status !== 'completed')
  ) || []
  const courtBMatches = tournament?.matches?.filter(m => 
    m.court === 'B' || (sharedGroups.includes(m.groupId) && m.status !== 'completed')
  ) || []
  
  // Get group order for queue display (use tournament groups or custom order)
  const courtAGroupOrder = state.courtAGroupOrder.length > 0 
    ? state.courtAGroupOrder 
    : (tournament?.groups || []).filter(gId => courtAMatches.some(m => m.groupId === gId))
  const courtBGroupOrder = state.courtBGroupOrder.length > 0 
    ? state.courtBGroupOrder 
    : (tournament?.groups || []).filter(gId => courtBMatches.some(m => m.groupId === gId))
  
  // Get pending matches sorted by group order then match order
  const getSortedPendingMatches = (matches: Match[], groupOrder: string[]) => {
    return matches
      .filter(m => m.status !== 'completed')
      .sort((a, b) => {
        const aGroupIdx = groupOrder.indexOf(a.groupId)
        const bGroupIdx = groupOrder.indexOf(b.groupId)
        if (aGroupIdx !== bGroupIdx) return aGroupIdx - bGroupIdx
        return a.orderIndex - b.orderIndex
      })
  }
  
  const pendingMatchesA = getSortedPendingMatches(courtAMatches, courtAGroupOrder)
  const pendingMatchesB = getSortedPendingMatches(courtBMatches, courtBGroupOrder)
  
  // If a match is manually selected, use it; otherwise use first pending match
  const selectedMatchIdA = state.courtASelectedMatch
  const selectedMatchIdB = state.courtBSelectedMatch
  
  const currentMatchA = selectedMatchIdA 
    ? courtAMatches.find(m => m.id === selectedMatchIdA && m.status !== 'completed')
    : pendingMatchesA[0]
  const currentMatchB = selectedMatchIdB
    ? courtBMatches.find(m => m.id === selectedMatchIdB && m.status !== 'completed')
    : pendingMatchesB[0]
  
  const currentMatch = selectedCourt === 'A' ? currentMatchA : currentMatchB
  const pendingMatches = selectedCourt === 'A' ? pendingMatchesA : pendingMatchesB
  const groupOrder = selectedCourt === 'A' ? courtAGroupOrder : courtBGroupOrder
  // const _currentMatches = selectedCourt === 'A' ? courtAMatches : courtBMatches
  
  const timerSeconds = selectedCourt === 'A' ? state.timerSecondsA : state.timerSecondsB
  const timerRunning = selectedCourt === 'A' ? state.timerRunningA : state.timerRunningB
  
  const group = currentMatch ? getGroupById(currentMatch.groupId) : null
  const player1 = currentMatch ? getMemberById(currentMatch.player1Id) : null
  const player2 = currentMatch ? getMemberById(currentMatch.player2Id) : null
  
  // Safe accessors
  const p1Score = currentMatch?.player1Score || []
  const p2Score = currentMatch?.player2Score || []
  const p1Hansoku = currentMatch?.player1Hansoku || 0
  const p2Hansoku = currentMatch?.player2Hansoku || 0
  const matchType = currentMatch?.matchType || 'sanbon'
  const timerDuration = currentMatch?.timerDuration || 180
  const winTarget = matchType === 'sanbon' ? 2 : 1

  // Auto-reset timer when match changes
  useEffect(() => {
    if (currentMatch && currentMatch.id !== lastMatchId) {
      setLastMatchId(currentMatch.id)
      // Reset timer for new match
      if (selectedCourt === 'A') {
        setState(prev => ({ ...prev, timerSecondsA: 0, timerRunningA: false }))
      } else {
        setState(prev => ({ ...prev, timerSecondsB: 0, timerRunningB: false }))
      }
    }
  }, [currentMatch?.id, selectedCourt, lastMatchId, setState])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => {
    const matchId = currentMatch?.id
    
    // When starting timer, lock match to this court
    if (matchId && !timerRunning) {
      setState(prev => {
        if (!prev.currentTournament) return prev
        const updatedMatches = prev.currentTournament.matches.map(m => 
          m.id === matchId ? { ...m, court: selectedCourt, status: 'in_progress' as const } : m
        )
        return {
          ...prev,
          currentTournament: { ...prev.currentTournament, matches: updatedMatches },
          timerRunningA: selectedCourt === 'A' ? true : prev.timerRunningA,
          timerRunningB: selectedCourt === 'B' ? true : prev.timerRunningB,
        }
      })
    } else {
      // Just toggle timer
      if (selectedCourt === 'A') {
        setState(prev => ({ ...prev, timerRunningA: !prev.timerRunningA }))
      } else {
        setState(prev => ({ ...prev, timerRunningB: !prev.timerRunningB }))
      }
    }
  }

  const resetTimer = () => {
    if (selectedCourt === 'A') {
      setState(prev => ({ ...prev, timerSecondsA: 0, timerRunningA: false }))
    } else {
      setState(prev => ({ ...prev, timerSecondsB: 0, timerRunningB: false }))
    }
  }

  // Update match settings (timer duration, match type)
  const updateMatchSettings = (field: 'timerDuration' | 'matchType', value: number | string) => {
    if (!tournament || !currentMatch) return
    const updatedMatches = tournament.matches.map(m => 
      m.id === currentMatch.id ? { ...m, [field]: value } : m
    )
    setState(prev => ({
      ...prev,
      currentTournament: { ...tournament, matches: updatedMatches }
    }))
  }

  // Score type definitions with circled letters
  const scoreTypes = [
    { id: 1, name: 'Men', letter: 'M', circle: 'Ⓜ' },
    { id: 2, name: 'Kote', letter: 'K', circle: 'Ⓚ' },
    { id: 3, name: 'Do', letter: 'D', circle: 'Ⓓ' },
    { id: 4, name: 'Tsuki', letter: 'T', circle: 'Ⓣ' },
    { id: 5, name: 'Hansoku', letter: 'H', circle: 'Ⓗ' }, // Point from opponent's 2 hansoku
  ]

  // Calculate effective points (including hansoku-derived points)
  const getEffectiveScore = (scores: number[], opponentHansoku: number) => {
    const directPoints = scores.length
    const hansokuPoints = Math.floor(opponentHansoku / 2)
    // Cap at win target - can't score more than needed to win
    return Math.min(directPoints + hansokuPoints, winTarget)
  }

  const p1EffectiveScore = getEffectiveScore(p1Score, p2Hansoku)
  const p2EffectiveScore = getEffectiveScore(p2Score, p1Hansoku)

  // In kendo, max 4 hansoku per player (4th = hansoku-make = automatic loss)
  // The button is disabled separately when game is over
  const p1MaxHansoku = 4
  const p2MaxHansoku = 4
  
  // Check if game is over (someone reached win target)
  const gameOver = p1EffectiveScore >= winTarget || p2EffectiveScore >= winTarget

  const addScore = (player: 'player1' | 'player2', scoreType: number) => {
    const matchId = currentMatch?.id
    if (!matchId) return
    
    setState(prev => {
      if (!prev.currentTournament) return prev
      const updatedMatches = prev.currentTournament.matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'in_progress' as const,
            court: selectedCourt,  // Lock to current court when match starts
            player1Score: player === 'player1' ? [...m.player1Score, scoreType] : m.player1Score,
            player2Score: player === 'player2' ? [...m.player2Score, scoreType] : m.player2Score,
          }
        }
        return m
      })
      return { ...prev, currentTournament: { ...prev.currentTournament, matches: updatedMatches } }
    })
  }

  const addHansoku = (player: 'player1' | 'player2') => {
    const matchId = currentMatch?.id
    if (!matchId) return
    
    const currentHansoku = player === 'player1' ? p1Hansoku : p2Hansoku
    const maxHansoku = player === 'player1' ? p1MaxHansoku : p2MaxHansoku
    
    if (currentHansoku >= maxHansoku) {
      toast.error(`Maximum hansoku reached`)
      return
    }

    const newHansoku = currentHansoku + 1

    setState(prev => {
      if (!prev.currentTournament) return prev
      const updatedMatches = prev.currentTournament.matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'in_progress' as const,
            court: selectedCourt,  // Lock to current court when match starts
            player1Hansoku: player === 'player1' ? newHansoku : m.player1Hansoku,
            player2Hansoku: player === 'player2' ? newHansoku : m.player2Hansoku,
          }
        }
        return m
      })
      return { ...prev, currentTournament: { ...prev.currentTournament, matches: updatedMatches } }
    })

    // Toast removed - yellow H circle shows the point visually
  }

  const removeLastScore = (player: 'player1' | 'player2') => {
    const matchId = currentMatch?.id
    if (!matchId) return

    setState(prev => {
      if (!prev.currentTournament) return prev
      const match = prev.currentTournament.matches.find(m => m.id === matchId)
      if (!match) return prev
      const scores = player === 'player1' ? match.player1Score : match.player2Score
      if (scores.length === 0) return prev
      
      const updatedMatches = prev.currentTournament.matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            player1Score: player === 'player1' ? m.player1Score.slice(0, -1) : m.player1Score,
            player2Score: player === 'player2' ? m.player2Score.slice(0, -1) : m.player2Score,
          }
        }
        return m
      })
      return { ...prev, currentTournament: { ...prev.currentTournament, matches: updatedMatches } }
    })
  }

  const removeHansoku = (player: 'player1' | 'player2') => {
    const matchId = currentMatch?.id
    if (!matchId) return

    setState(prev => {
      if (!prev.currentTournament) return prev
      const match = prev.currentTournament.matches.find(m => m.id === matchId)
      if (!match) return prev
      const hansoku = player === 'player1' ? match.player1Hansoku : match.player2Hansoku
      if (hansoku === 0) return prev
      
      const updatedMatches = prev.currentTournament.matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            player1Hansoku: player === 'player1' ? Math.max(0, m.player1Hansoku - 1) : m.player1Hansoku,
            player2Hansoku: player === 'player2' ? Math.max(0, m.player2Hansoku - 1) : m.player2Hansoku,
          }
        }
        return m
      })
      return { ...prev, currentTournament: { ...prev.currentTournament, matches: updatedMatches } }
    })
  }

  const completeMatch = (winner: 'player1' | 'player2' | 'draw') => {
    const matchId = currentMatch?.id
    if (!matchId) return

    setState(prev => {
      if (!prev.currentTournament) return prev
      const updatedMatches = prev.currentTournament.matches.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            status: 'completed' as const,
            winner: winner === 'draw' ? 'draw' : winner,
            actualDuration: timerSeconds,
          }
        }
        return m
      })
      return {
        ...prev,
        currentTournament: { ...prev.currentTournament, matches: updatedMatches },
        courtASelectedMatch: selectedCourt === 'A' ? null : prev.courtASelectedMatch,
        courtBSelectedMatch: selectedCourt === 'B' ? null : prev.courtBSelectedMatch,
      }
    })
    
    // Show next match toast
    toast('Starting Next Match...', {
      icon: '⚔️',
      duration: 3000,
      style: {
        background: '#1e3a5f',
        color: '#fff',
        border: '2px solid #f59e0b',
        fontSize: '16px',
        fontWeight: 'bold',
        padding: '16px',
      },
    })
  }

  // Select a specific match to play next (override queue)
  const selectMatch = (matchId: string) => {
    if (selectedCourt === 'A') {
      setState(prev => ({ ...prev, courtASelectedMatch: matchId }))
    } else {
      setState(prev => ({ ...prev, courtBSelectedMatch: matchId }))
    }
    toast.success('Match selected - will start next')
  }

  // Clear selected match (resume normal queue)
  const clearSelectedMatch = () => {
    if (selectedCourt === 'A') {
      setState(prev => ({ ...prev, courtASelectedMatch: null }))
    } else {
      setState(prev => ({ ...prev, courtBSelectedMatch: null }))
    }
  }

  // Move group up/down in queue order
  const moveGroupInQueue = (groupId: string, direction: 'up' | 'down') => {
    const currentOrder = selectedCourt === 'A' ? [...courtAGroupOrder] : [...courtBGroupOrder]
    const idx = currentOrder.indexOf(groupId)
    if (idx === -1) return
    
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= currentOrder.length) return
    
    // Swap
    [currentOrder[idx], currentOrder[newIdx]] = [currentOrder[newIdx], currentOrder[idx]]
    
    if (selectedCourt === 'A') {
      setState(prev => ({ ...prev, courtAGroupOrder: currentOrder }))
    } else {
      setState(prev => ({ ...prev, courtBGroupOrder: currentOrder }))
    }
  }

  const toggleSharedGroupCK = (groupId: string) => {
    const isCurrentlyShared = (state.sharedGroups || []).includes(groupId)
    if (isCurrentlyShared) {
      // Remove from shared - assign all pending to current court
      setState(prev => {
        if (!prev.currentTournament) return prev
        const updatedMatches = prev.currentTournament.matches.map(m => 
          m.groupId === groupId && m.status === 'pending' ? { ...m, court: selectedCourt } : m
        )
        return {
          ...prev,
          sharedGroups: (prev.sharedGroups || []).filter(g => g !== groupId),
          currentTournament: { ...prev.currentTournament, matches: updatedMatches }
        }
      })
      toast.success(`Group now on Court ${selectedCourt} only`)
    } else {
      // Add to shared groups
      setState(prev => ({
        ...prev,
        sharedGroups: [...(prev.sharedGroups || []), groupId]
      }))
      toast.success(`Group shared between both courts`)
    }
  }

  // Reorder match in queue (drag and drop)
  const reorderMatch = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return
    
    setState(prev => {
      if (!prev.currentTournament) return prev
      const matches = [...prev.currentTournament.matches]
      const draggedMatch = matches.find(m => m.id === draggedId)
      const targetMatch = matches.find(m => m.id === targetId)
      
      if (!draggedMatch || !targetMatch) return prev
      if (draggedMatch.groupId !== targetMatch.groupId) return prev // Only within same group
      if (draggedMatch.status !== 'pending' || targetMatch.status !== 'pending') return prev
      
      // Swap orderIndex values
      const tempOrder = draggedMatch.orderIndex
      draggedMatch.orderIndex = targetMatch.orderIndex
      targetMatch.orderIndex = tempOrder
      
      return { ...prev, currentTournament: { ...prev.currentTournament, matches } }
    })
  }

  // No tournament or not started
  if (!tournament || tournament.status !== 'in_progress') {
    return (
      <div className="min-h-screen bg-[#0a1017] flex items-center justify-center p-4">
        <Toaster theme="dark" position="top-center" />
        <Card className="bg-[#0f1a24] border-[#1e3a5f] max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-white text-center">No Active Tournament</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <RenbuLogo size={80} className="mx-auto opacity-50" />
            <p className="text-[#b8d4ec]">
              {tournament ? 'Tournament needs to be started from Admin Portal' : 'No tournament generated yet'}
            </p>
            <Button onClick={onSwitchPortal} variant="outline" className="border-orange-500 text-orange-400">
              Go to Admin Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No current match
  if (!currentMatch) {
    return (
      <div className="min-h-screen bg-[#0a1017] flex items-center justify-center p-4">
        <Toaster theme="dark" position="top-center" />
        <Card className="bg-[#0f1a24] border-[#1e3a5f] max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-white text-center">All Matches Complete!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Trophy className="w-16 h-16 text-amber-500 mx-auto" />
            <p className="text-[#b8d4ec]">Court {selectedCourt} has no more matches</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setSelectedCourt(selectedCourt === 'A' ? 'B' : 'A')} className="bg-[#1e3a5f]">
                Switch to Court {selectedCourt === 'A' ? 'B' : 'A'}
              </Button>
              <Button onClick={onSwitchPortal} variant="outline" className="border-orange-500 text-orange-400">
                Admin Portal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const [showQueue, setShowQueue] = useState(false)
  const [showGroupQueue, setShowGroupQueue] = useState(true)
  const [showWinModal, setShowWinModal] = useState(false)
  const [pendingWinner, setPendingWinner] = useState<'player1' | 'player2' | null>(null)
  const [modalDismissedForMatch, setModalDismissedForMatch] = useState<string | null>(null)
  const [draggedMatchId, setDraggedMatchId] = useState<string | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  
  // Detect when someone wins and show modal, or close if score undone
  useEffect(() => {
    const p1Wins = p1EffectiveScore >= winTarget
    const p2Wins = p2EffectiveScore >= winTarget
    const matchId = currentMatch?.id
    
    // Don't show modal if user dismissed it for this match
    const wasDismissed = modalDismissedForMatch === matchId
    
    if (p1Wins && !showWinModal && !wasDismissed) {
      setPendingWinner('player1')
      setShowWinModal(true)
    } else if (p2Wins && !showWinModal && !wasDismissed) {
      setPendingWinner('player2')
      setShowWinModal(true)
    } else if (showWinModal && !p1Wins && !p2Wins) {
      // Score was undone (possibly from another device) - close modal
      setShowWinModal(false)
      setPendingWinner(null)
      setModalDismissedForMatch(null) // Reset so modal can show again if they win again
    }
  }, [p1EffectiveScore, p2EffectiveScore, winTarget, showWinModal, currentMatch?.id, modalDismissedForMatch])

  // Undo the winning point
  const undoWinningPoint = () => {
    if (!currentMatch) return
    const matchId = currentMatch.id
    
    // Figure out what caused the win - check hansoku first
    const winner = pendingWinner
    if (!winner) return
    
    // If winner got point from opponent's hansoku, undo hansoku
    const opponentHansoku = winner === 'player1' ? p2Hansoku : p1Hansoku
    const winnerDirectScore = winner === 'player1' ? p1Score : p2Score
    
    if (opponentHansoku >= 2 && opponentHansoku % 2 === 0) {
      // Last point was from hansoku pair - remove opponent's last hansoku
      const opponent = winner === 'player1' ? 'player2' : 'player1'
      setState(prev => {
        if (!prev.currentTournament) return prev
        const updatedMatches = prev.currentTournament.matches.map(m => {
          if (m.id === matchId) {
            return {
              ...m,
              player1Hansoku: opponent === 'player1' ? Math.max(0, m.player1Hansoku - 1) : m.player1Hansoku,
              player2Hansoku: opponent === 'player2' ? Math.max(0, m.player2Hansoku - 1) : m.player2Hansoku,
            }
          }
          return m
        })
        return { ...prev, currentTournament: { ...prev.currentTournament, matches: updatedMatches } }
      })
    } else if (winnerDirectScore.length > 0) {
      // Last point was direct score - remove it
      setState(prev => {
        if (!prev.currentTournament) return prev
        const updatedMatches = prev.currentTournament.matches.map(m => {
          if (m.id === matchId) {
            return {
              ...m,
              player1Score: winner === 'player1' ? m.player1Score.slice(0, -1) : m.player1Score,
              player2Score: winner === 'player2' ? m.player2Score.slice(0, -1) : m.player2Score,
            }
          }
          return m
        })
        return { ...prev, currentTournament: { ...prev.currentTournament, matches: updatedMatches } }
      })
    }
    
    setShowWinModal(false)
    setPendingWinner(null)
    setModalDismissedForMatch(null)
  }

  // Confirm the win
  const confirmWin = () => {
    if (pendingWinner) {
      completeMatch(pendingWinner)
    }
    setShowWinModal(false)
    setPendingWinner(null)
    setModalDismissedForMatch(null)
  }
  
  // Get next pending match (after current)
  const getNextMatch = () => {
    const currentIdx = pendingMatches.findIndex(m => m.id === currentMatch?.id)
    return currentIdx >= 0 && currentIdx < pendingMatches.length - 1 
      ? pendingMatches[currentIdx + 1] 
      : pendingMatches.find(m => m.id !== currentMatch?.id)
  }
  const nextMatch = getNextMatch()
  const nextPlayer1 = nextMatch ? getMemberById(nextMatch.player1Id) : null
  const nextPlayer2 = nextMatch ? getMemberById(nextMatch.player2Id) : null
  const nextGroup = nextMatch ? getGroupById(nextMatch.groupId) : null

  return (
    <div className="h-screen bg-[#0a0e14] text-white flex flex-col overflow-hidden">
      <Toaster theme="dark" position="top-center" />
      
      {/* Header */}
      <header className="bg-[#0f1419] border-b border-slate-800 px-3 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RenbuLogo size={24} glow />
            <span className="font-bold text-sm">COURTKEEPER</span>
          </div>
          <button 
            onClick={() => setShowQueue(true)}
            className={`p-2 rounded-lg ${selectedCourt === 'A' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'}`}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-3 gap-3 overflow-auto">
        {/* Group Header Bar */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded font-bold ${selectedCourt === 'A' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'}`}>
              {selectedCourt === 'A' ? 'COURT A' : 'COURT B'}
            </span>
            <span className="text-slate-400 font-semibold uppercase">{group?.name || 'No Match'}</span>
            {group?.isNonBogu && <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded text-[10px]">Hantei</span>}
          </div>
          {!group?.isNonBogu && (
            <div className="flex items-center gap-1">
              <select 
                value={timerDuration} 
                onChange={(e) => updateMatchSettings('timerDuration', parseInt(e.target.value))}
                className="bg-slate-800 border-0 rounded px-1.5 py-0.5 text-[10px] text-slate-300"
              >
                {(tournament?.timerOptions || [120, 180, 240, 300]).map(secs => (
                  <option key={secs} value={secs}>{Math.floor(secs / 60)}:{(secs % 60).toString().padStart(2, '0')}</option>
                ))}
              </select>
              <select 
                value={matchType} 
                onChange={(e) => updateMatchSettings('matchType', e.target.value)}
                className="bg-slate-800 border-0 rounded px-1.5 py-0.5 text-[10px] text-slate-300"
              >
                <option value="sanbon">Sanbon</option>
                <option value="ippon">Ippon</option>
              </select>
            </div>
          )}
        </div>

        {/* Score Display */}
        <div className="bg-gradient-to-r from-red-950/30 via-[#12181f] to-slate-700/20 rounded-xl p-3">
          {/* Names Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-red-400 text-[10px] font-medium">AKA</p>
              <p className="text-sm font-semibold truncate">
                {player1 ? formatDisplayName(player1, state.members, state.useFirstNamesOnly) : '—'}
              </p>
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-slate-400 text-[10px] font-medium">SHIRO</p>
              <p className="text-sm font-semibold truncate">
                {player2 ? formatDisplayName(player2, state.members, state.useFirstNamesOnly) : '—'}
              </p>
            </div>
          </div>
          
          {/* Score Row: Letters + Numbers + Letters */}
          <div className="flex items-center justify-center gap-2">
            {/* P1 Score Letters (direct + H for opponent hansoku pairs, capped at winTarget) */}
            <div className="flex gap-1 justify-end min-w-[60px]">
              {p1Score.filter(s => s !== 5).slice(0, winTarget).map((s, i) => (
                <span key={`p1-${i}`} className="w-5 h-5 rounded-full border border-red-400 text-red-400 flex items-center justify-center text-[10px] font-bold">
                  {scoreTypes.find(t => t.id === s)?.letter}
                </span>
              ))}
              {/* Yellow H circles - only show what's needed to reach winTarget */}
              {Array.from({ length: Math.min(Math.floor(p2Hansoku / 2), winTarget - Math.min(p1Score.length, winTarget)) }).map((_, i) => (
                <span key={`p1-h-${i}`} className="w-5 h-5 rounded-full border border-yellow-400 bg-yellow-400/20 text-yellow-400 flex items-center justify-center text-[10px] font-bold">
                  H
                </span>
              ))}
            </div>
            
            {/* Center Numbers */}
            <div className="text-3xl font-mono font-bold px-2">
              <span className="text-red-400">{p1EffectiveScore}</span>
              <span className="text-slate-500 mx-1">:</span>
              <span className="text-slate-200">{p2EffectiveScore}</span>
            </div>
            
            {/* P2 Score Letters (direct + H for opponent hansoku pairs, capped at winTarget) */}
            <div className="flex gap-1 min-w-[60px]">
              {/* Yellow H circles - only show what's needed to reach winTarget */}
              {Array.from({ length: Math.min(Math.floor(p1Hansoku / 2), winTarget - Math.min(p2Score.length, winTarget)) }).map((_, i) => (
                <span key={`p2-h-${i}`} className="w-5 h-5 rounded-full border border-yellow-400 bg-yellow-400/20 text-yellow-400 flex items-center justify-center text-[10px] font-bold">
                  H
                </span>
              ))}
              {p2Score.filter(s => s !== 5).slice(0, winTarget).map((s, i) => (
                <span key={`p2-${i}`} className="w-5 h-5 rounded-full border border-slate-400 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                  {scoreTypes.find(t => t.id === s)?.letter}
                </span>
              ))}
            </div>
          </div>
          
          {/* Hansoku indicator - fixed layout, always centered */}
          <div className="flex items-center justify-center mt-2 pt-2 border-t border-slate-700/30">
            <div className="w-16 flex justify-end">
              {p1Hansoku % 2 === 1 && <span className="text-yellow-400 text-xl drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]">▲</span>}
            </div>
            <span className="text-slate-500 mx-3 text-xs">Hansoku</span>
            <div className="w-16 flex justify-start">
              {p2Hansoku % 2 === 1 && <span className="text-yellow-400 text-xl drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]">▲</span>}
            </div>
          </div>
        </div>

        {/* Score Buttons - Fixed size, not stretched */}
        {!currentMatch?.isHantei && (
          <div className="grid grid-cols-2 gap-3">
            {/* AKA Controls */}
            <div className="bg-red-950/20 rounded-xl p-3 border border-red-900/30">
              <p className="text-red-400 text-[10px] font-bold mb-2">AKA</p>
              <div className="grid grid-cols-2 gap-2">
                {scoreTypes.slice(0, 4).map(type => (
                  <button
                    key={`p1-${type.id}`}
                    onClick={() => addScore('player1', type.id)}
                    disabled={gameOver}
                    className="h-14 rounded-lg border-2 border-red-500/50 text-red-400 hover:bg-red-500/20 disabled:opacity-30 flex items-center justify-center"
                  >
                    <span className="w-9 h-9 rounded-full border-2 border-current flex items-center justify-center text-base font-bold">
                      {type.letter}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => removeHansoku('player1')}
                  className="w-9 h-9 rounded-lg text-[10px] border border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10 flex items-center justify-center"
                >
                  <Undo2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => addHansoku('player1')}
                  disabled={p1Hansoku >= p1MaxHansoku || gameOver}
                  className="flex-1 h-9 rounded-lg text-xs border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => removeLastScore('player1')}
                  className="w-12 h-9 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-700/50 flex items-center justify-center"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SHIRO Controls */}
            <div className="bg-slate-700/20 rounded-xl p-3 border border-slate-700/30">
              <p className="text-slate-400 text-[10px] font-bold mb-2 text-right">SHIRO</p>
              <div className="grid grid-cols-2 gap-2">
                {scoreTypes.slice(0, 4).map(type => (
                  <button
                    key={`p2-${type.id}`}
                    onClick={() => addScore('player2', type.id)}
                    disabled={gameOver}
                    className="h-14 rounded-lg border-2 border-slate-500/50 text-slate-300 hover:bg-slate-500/20 disabled:opacity-30 flex items-center justify-center"
                  >
                    <span className="w-9 h-9 rounded-full border-2 border-current flex items-center justify-center text-base font-bold">
                      {type.letter}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => removeLastScore('player2')}
                  className="w-12 h-9 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-700/50 flex items-center justify-center"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => addHansoku('player2')}
                  disabled={p2Hansoku >= p2MaxHansoku || gameOver}
                  className="flex-1 h-9 rounded-lg text-xs border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => removeHansoku('player2')}
                  className="w-9 h-9 rounded-lg text-[10px] border border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10 flex items-center justify-center"
                >
                  <Undo2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hantei Buttons */}
        {currentMatch?.isHantei && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => completeMatch('player1')}
              className="h-16 rounded-xl font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 flex items-center justify-center gap-2"
            >
              <Award className="w-5 h-5" /> AKA Wins
            </button>
            <button
              onClick={() => completeMatch('player2')}
              className="h-16 rounded-xl font-bold bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 flex items-center justify-center gap-2"
            >
              <Award className="w-5 h-5" /> SHIRO Wins
            </button>
          </div>
        )}

        {/* Timer */}
        {!group?.isNonBogu && (
          <div className={`rounded-xl p-3 flex items-center gap-3 ${timerSeconds >= timerDuration ? 'bg-amber-950/30 border border-amber-500' : 'bg-slate-800/30'}`}>
            <button
              onClick={toggleTimer}
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                timerRunning ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-white'
              }`}
            >
              {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            
            <div className="flex-1 text-center">
              <div className={`text-3xl font-mono font-bold ${timerSeconds >= timerDuration ? 'text-amber-400' : 'text-white'}`}>
                {formatTime(timerSeconds)}
              </div>
              {timerSeconds >= timerDuration ? (
                <div className="w-full h-5 bg-amber-500 rounded-full mt-1 flex items-center justify-center">
                  <span className="text-black font-bold text-xs">TIME!</span>
                </div>
              ) : (
                <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full transition-all bg-emerald-500"
                    style={{ width: `${Math.min((timerSeconds / timerDuration) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
            
            <button
              onClick={resetTimer}
              className="w-12 h-12 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center justify-center flex-shrink-0"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Up Next Card */}
        {nextMatch && (
          <div className="bg-slate-800/20 rounded-xl p-2 border border-slate-700/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">UP NEXT</span>
              <span className="text-slate-600">{nextGroup?.name}</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-1 text-sm">
              <span className="text-red-400">{nextPlayer1 ? formatDisplayName(nextPlayer1, state.members, state.useFirstNamesOnly) : '?'}</span>
              <span className="text-slate-500">vs</span>
              <span className="text-slate-300">{nextPlayer2 ? formatDisplayName(nextPlayer2, state.members, state.useFirstNamesOnly) : '?'}</span>
            </div>
          </div>
        )}

        {/* Match Complete Buttons */}
        {!currentMatch?.isHantei && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => completeMatch('player1')}
              disabled={!gameOver}
              className="py-2.5 rounded-lg font-bold text-xs bg-red-600/80 hover:bg-red-600 disabled:opacity-30"
            >
              AKA Wins
            </button>
            <button
              onClick={() => completeMatch('draw')}
              className="py-2.5 rounded-lg font-bold text-xs bg-slate-700 hover:bg-slate-600"
            >
              Draw
            </button>
            <button
              onClick={() => completeMatch('player2')}
              disabled={!gameOver}
              className="py-2.5 rounded-lg font-bold text-xs bg-slate-500/80 hover:bg-slate-500 disabled:opacity-30"
            >
              SHIRO Wins
            </button>
          </div>
        )}
      </main>

      {/* Win Confirmation Modal */}
      {showWinModal && pendingWinner && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl p-6 max-w-sm w-full text-center border-2 relative ${
            pendingWinner === 'player1' 
              ? 'bg-gradient-to-b from-red-950/90 to-[#1a2535] border-red-500/50' 
              : 'bg-gradient-to-b from-slate-700/90 to-[#1a2535] border-slate-400/50'
          }`}>
            <button
              onClick={() => { setShowWinModal(false); setPendingWinner(null); setModalDismissedForMatch(currentMatch?.id || null) }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
            >
              ✕
            </button>
            <div className="text-5xl mb-3">🏆</div>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
              pendingWinner === 'player1' ? 'bg-red-500 text-white' : 'bg-slate-300 text-slate-900'
            }`}>
              {pendingWinner === 'player1' ? 'AKA' : 'SHIRO'}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {pendingWinner === 'player1' 
                ? (player1 ? formatDisplayName(player1, state.members, state.useFirstNamesOnly) : 'AKA')
                : (player2 ? formatDisplayName(player2, state.members, state.useFirstNamesOnly) : 'SHIRO')
              }
            </h2>
            <p className="text-slate-400 text-lg mb-5">wins!</p>
            <div className="space-y-2">
              <button
                onClick={confirmWin}
                className="w-full py-3 rounded-xl font-bold text-lg bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Yes, Complete Match
              </button>
              <button
                onClick={undoWinningPoint}
                className="w-full py-3 rounded-xl font-bold text-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
              >
                No, Undo Last Point
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Queue Slide Panel */}
      {showQueue && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowQueue(false)} />
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-[#0f1419] border-l border-slate-800 z-50 flex flex-col">
            {/* Panel Header */}
            <div className="p-3 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold">Menu</span>
                <button onClick={() => setShowQueue(false)} className="p-1 rounded hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Court Switch */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-slate-400 text-xs">Court:</span>
                <button
                  onClick={() => { setSelectedCourt('A'); setShowQueue(false) }}
                  className={`px-4 py-1.5 rounded text-xs font-bold ${selectedCourt === 'A' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}
                >
                  A
                </button>
                <button
                  onClick={() => { setSelectedCourt('B'); setShowQueue(false) }}
                  className={`px-4 py-1.5 rounded text-xs font-bold ${selectedCourt === 'B' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  B
                </button>
              </div>
              
              <button 
                onClick={onSwitchPortal}
                className="w-full py-2 rounded bg-slate-800 text-slate-400 text-xs hover:bg-slate-700 flex items-center justify-center gap-2"
              >
                <ArrowLeftRight className="w-3 h-3" /> Switch to Admin
              </button>
            </div>
            
            {/* Group Queue - Collapsible */}
            <div className="border-b border-slate-800">
              <button 
                onClick={() => setShowGroupQueue(!showGroupQueue)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-slate-400 hover:bg-slate-800/50"
              >
                <span>Group Queue</span>
                {showGroupQueue ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showGroupQueue && (
                <div className="px-3 pb-2 space-y-1">
                  {groupOrder.map((groupId, gIdx) => {
                    const groupInfo = getGroupById(groupId)
                    const groupMatchCount = pendingMatches.filter(m => m.groupId === groupId).length
                    const isShared = (state.sharedGroups || []).includes(groupId)
                    if (groupMatchCount === 0) return null
                    return (
                      <div key={groupId} className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${isShared ? 'bg-emerald-500 text-white' : selectedCourt === 'A' ? 'bg-amber-500/30 text-amber-400' : 'bg-blue-500/30 text-blue-400'}`}>
                            {isShared ? 'A+B' : selectedCourt}
                          </span>
                          <span className="text-slate-300">{groupInfo?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">{groupMatchCount}</span>
                          <button
                            onClick={() => toggleSharedGroupCK(groupId)}
                            className={`px-1.5 h-5 rounded text-[9px] font-medium ${isShared ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                          >{isShared ? '✓A+B' : 'A+B'}</button>
                          <button
                            onClick={() => moveGroupInQueue(groupId, 'up')}
                            disabled={gIdx === 0}
                            className="w-5 h-5 rounded text-[10px] bg-slate-800 text-slate-500 disabled:opacity-30"
                          >▲</button>
                          <button
                            onClick={() => moveGroupInQueue(groupId, 'down')}
                            disabled={gIdx === groupOrder.length - 1}
                            className="w-5 h-5 rounded text-[10px] bg-slate-800 text-slate-500 disabled:opacity-30"
                          >▼</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Match Queue Header */}
            <div className="px-3 py-2 flex items-center justify-between flex-shrink-0">
              <span className="text-slate-400 text-xs font-medium">Match Queue</span>
              {(selectedCourt === 'A' ? selectedMatchIdA : selectedMatchIdB) && (
                <button onClick={clearSelectedMatch} className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  Clear
                </button>
              )}
            </div>
            
            {/* Match Queue List */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {groupOrder.map((groupId) => {
                const groupInfo = getGroupById(groupId)
                const groupMatches = pendingMatches.filter(m => m.groupId === groupId)
                if (groupMatches.length === 0) return null
                
                return (
                  <div key={groupId} className="mb-2">
                    <div className="px-1 py-1 flex items-center gap-1">
                      {(state.sharedGroups || []).includes(groupId) && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-600 text-white font-bold">A+B</span>
                      )}
                      <span className="text-slate-500 text-[10px] font-medium">{groupInfo?.name}</span>
                    </div>
                    {groupMatches.map((match) => {
                      const mp1 = getMemberById(match.player1Id)
                      const mp2 = getMemberById(match.player2Id)
                      const isSelected = match.id === (selectedCourt === 'A' ? selectedMatchIdA : selectedMatchIdB)
                      const isCurrentlyPlaying = match.id === currentMatch?.id
                      const isSharedGroup = (state.sharedGroups || []).includes(groupId)
                      const isLiveOnOtherCourt = match.status === 'in_progress' && !isCurrentlyPlaying
                      const canDrag = match.status === 'pending' && !isCurrentlyPlaying && !isLiveOnOtherCourt
                      const isDragging = draggedMatchId === match.id
                      const isDragTarget = draggedMatchId && draggedMatchId !== match.id && canDrag
                      
                      return (
                        <div
                          key={match.id}
                          draggable={canDrag}
                          onDragStart={(e) => {
                            if (!canDrag) return
                            setDraggedMatchId(match.id)
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragEnd={() => setDraggedMatchId(null)}
                          onDragOver={(e) => {
                            if (!isDragTarget) return
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            if (draggedMatchId && isDragTarget) {
                              reorderMatch(draggedMatchId, match.id)
                            }
                            setDraggedMatchId(null)
                          }}
                          onTouchStart={(e) => {
                            if (!canDrag) return
                            setTouchStartY(e.touches[0].clientY)
                            setDraggedMatchId(match.id)
                          }}
                          onTouchMove={(e) => {
                            if (!draggedMatchId || touchStartY === null) return
                            const touch = e.touches[0]
                            const target = document.elementFromPoint(touch.clientX, touch.clientY)
                            const matchEl = target?.closest('[data-match-id]')
                            if (matchEl) {
                              const targetId = matchEl.getAttribute('data-match-id')
                              if (targetId && targetId !== draggedMatchId) {
                                reorderMatch(draggedMatchId, targetId)
                              }
                            }
                          }}
                          onTouchEnd={() => {
                            setDraggedMatchId(null)
                            setTouchStartY(null)
                          }}
                          data-match-id={match.id}
                          onClick={() => { if (!isCurrentlyPlaying && !isLiveOnOtherCourt && !isDragging) { selectMatch(match.id); setShowQueue(false) } }}
                          className={`w-full p-2 rounded-lg mb-1 text-xs transition-all cursor-pointer select-none ${
                            isDragging ? 'opacity-50 scale-95 bg-amber-900/50 border border-amber-400' :
                            isDragTarget ? 'border-2 border-dashed border-amber-400/50' :
                            isCurrentlyPlaying ? 'bg-emerald-900/30 border border-emerald-600' 
                            : isLiveOnOtherCourt ? 'bg-emerald-900/20 border border-emerald-700/50 opacity-60'
                            : isSelected ? 'bg-amber-900/30 border border-amber-500'
                            : 'bg-slate-800/50 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center">
                            {canDrag && !isSelected && !isCurrentlyPlaying && (
                              <span className="text-slate-600 mr-2 cursor-grab">☰</span>
                            )}
                            {isCurrentlyPlaying && (
                              <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500 text-white font-bold mr-2">
                                LIVE{isSharedGroup ? ` ${selectedCourt}` : ''}
                              </span>
                            )}
                            {isLiveOnOtherCourt && (
                              <span className={`text-[8px] px-1 py-0.5 rounded font-bold mr-2 ${match.court === 'A' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'}`}>
                                LIVE {match.court}
                              </span>
                            )}
                            {isSelected && !isCurrentlyPlaying && !isLiveOnOtherCourt && <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500 text-black font-bold mr-2">NEXT</span>}
                            <span className="text-red-400 truncate flex-1 text-left">
                              {mp1 ? formatDisplayName(mp1, state.members, state.useFirstNamesOnly) : '?'}
                            </span>
                            <span className="text-slate-500 px-2">vs</span>
                            <span className="text-slate-300 truncate flex-1 text-right">
                              {mp2 ? formatDisplayName(mp2, state.members, state.useFirstNamesOnly) : '?'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
              {pendingMatches.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">No pending matches</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}





declare global {
  interface Window {
    storage?: {
      get: (key: string, shared?: boolean) => Promise<{ value: string } | null>
      set: (key: string, value: string, shared?: boolean) => Promise<{ key: string; value: string } | null>
      delete: (key: string, shared?: boolean) => Promise<{ key: string; deleted: boolean } | null>
      list: (prefix?: string, shared?: boolean) => Promise<{ keys: string[] } | null>
    }
  }
}

