// Font Awesome Pro 7.1.0 Icons as React Components
// Converted from SVG files
import React from 'react'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export const Users = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M320 16a104 104 0 1 1 0 208 104 104 0 1 1 0-208zM96 88a72 72 0 1 1 0 144 72 72 0 1 1 0-144zM0 416c0-70.7 57.3-128 128-128 12.8 0 25.2 1.9 36.9 5.4-32.9 36.8-52.9 85.4-52.9 138.6l0 16c0 11.4 2.4 22.2 6.7 32L32 480c-17.7 0-32-14.3-32-32l0-32zm521.3 64c4.3-9.8 6.7-20.6 6.7-32l0-16c0-53.2-20-101.8-52.9-138.6 11.7-3.5 24.1-5.4 36.9-5.4 70.7 0 128 57.3 128 128l0 32c0 17.7-14.3 32-32 32l-86.7 0zM472 160a72 72 0 1 1 144 0 72 72 0 1 1 -144 0zM160 432c0-88.4 71.6-160 160-160s160 71.6 160 160l0 16c0 17.7-14.3 32-32 32l-256 0c-17.7 0-32-14.3-32-32l0-16z" />
  </svg>
)

export const Settings = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M195.1 9.5C198.1-5.3 211.2-16 226.4-16l59.8 0c15.2 0 28.3 10.7 31.3 25.5L332 79.5c14.1 6 27.3 13.7 39.3 22.8l67.8-22.5c14.4-4.8 30.2 1.2 37.8 14.4l29.9 51.8c7.6 13.2 4.9 29.8-6.5 39.9L447 233.3c.9 7.4 1.3 15 1.3 22.7s-.5 15.3-1.3 22.7l53.4 47.5c11.4 10.1 14 26.8 6.5 39.9l-29.9 51.8c-7.6 13.1-23.4 19.2-37.8 14.4l-67.8-22.5c-12.1 9.1-25.3 16.7-39.3 22.8l-14.4 69.9c-3.1 14.9-16.2 25.5-31.3 25.5l-59.8 0c-15.2 0-28.3-10.7-31.3-25.5l-14.4-69.9c-14.1-6-27.2-13.7-39.3-22.8L73.5 432.3c-14.4 4.8-30.2-1.2-37.8-14.4L5.8 366.1c-7.6-13.2-4.9-29.8 6.5-39.9l53.4-47.5c-.9-7.4-1.3-15-1.3-22.7s.5-15.3 1.3-22.7L12.3 185.8c-11.4-10.1-14-26.8-6.5-39.9L35.7 94.1c7.6-13.2 23.4-19.2 37.8-14.4l67.8 22.5c12.1-9.1 25.3-16.7 39.3-22.8L195.1 9.5zM256.3 336a80 80 0 1 0 -.6-160 80 80 0 1 0 .6 160z" />
  </svg>
)

export const Trophy = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M144.3 0l224 0c26.5 0 48.1 21.8 47.1 48.2-.2 5.3-.4 10.6-.7 15.8l49.6 0c26.1 0 49.1 21.6 47.1 49.8-7.5 103.7-60.5 160.7-118 190.5-15.8 8.2-31.9 14.3-47.2 18.8-20.2 28.6-41.2 43.7-57.9 51.8l0 73.1 64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-192 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l64 0 0-73.1c-16-7.7-35.9-22-55.3-48.3-18.4-4.8-38.4-12.1-57.9-23.1-54.1-30.3-102.9-87.4-109.9-189.9-1.9-28.1 21-49.7 47.1-49.7l49.6 0c-.3-5.2-.5-10.4-.7-15.8-1-26.5 20.6-48.2 47.1-48.2zM101.5 112l-52.4 0c6.2 84.7 45.1 127.1 85.2 149.6-14.4-37.3-26.3-86-32.8-149.6zM380 256.8c40.5-23.8 77.1-66.1 83.3-144.8L411 112c-6.2 60.9-17.4 108.2-31 144.8z" />
  </svg>
)

export const Play = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M91.2 36.9c-12.4-6.8-27.4-6.5-39.6 .7S32 57.9 32 72l0 368c0 14.1 7.5 27.2 19.6 34.4s27.2 7.5 39.6 .7l336-184c12.8-7 20.8-20.5 20.8-35.1s-8-28.1-20.8-35.1l-336-184z" />
  </svg>
)

export const Pause = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M48 32C21.5 32 0 53.5 0 80L0 432c0 26.5 21.5 48 48 48l64 0c26.5 0 48-21.5 48-48l0-352c0-26.5-21.5-48-48-48L48 32zm224 0c-26.5 0-48 21.5-48 48l0 352c0 26.5 21.5 48 48 48l64 0c26.5 0 48-21.5 48-48l0-352c0-26.5-21.5-48-48-48l-64 0z" />
  </svg>
)

export const RotateCcw = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M24 192l144 0c9.7 0 18.5-5.8 22.2-14.8s1.7-19.3-5.2-26.2l-46.7-46.7c75.3-58.6 184.3-53.3 253.5 15.9 75 75 75 196.5 0 271.5s-196.5 75-271.5 0c-10.2-10.2-19-21.3-26.4-33-9.5-14.9-29.3-19.3-44.2-9.8s-19.3 29.3-9.8 44.2C49.7 408.7 61.4 423.5 75 437 175 537 337 537 437 437S537 175 437 75C342.8-19.3 193.3-24.7 92.7 58.8L41 7C34.1 .2 23.8-1.9 14.8 1.8S0 14.3 0 24L0 168c0 13.3 10.7 24 24 24z" />
  </svg>
)

export const GripVertical = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M128 40c0-22.1-17.9-40-40-40L40 0C17.9 0 0 17.9 0 40L0 88c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zM0 424l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM320 40c0-22.1-17.9-40-40-40L232 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zM192 232l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM320 424c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48z" />
  </svg>
)

export const Check = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M434.8 70.1c14.3 10.4 17.5 30.4 7.1 44.7l-256 352c-5.5 7.6-14 12.3-23.4 13.1s-18.5-2.7-25.1-9.3l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l101.5 101.5 234-321.7c10.4-14.3 30.4-17.5 44.7-7.1z" />
  </svg>
)

export const Triangle = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M291.2 21C284.2 8.1 270.7 0 256 0s-28.2 8.1-35.2 21L4.8 421c-6.7 12.4-6.4 27.4 .8 39.5S25.9 480 40 480l432 0c14.1 0 27.1-7.4 34.4-19.5s7.5-27.1 .8-39.5L291.2 21z" />
  </svg>
)

export const Plus = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M256 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 160-160 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l160 0 0 160c0 17.7 14.3 32 32 32s32-14.3 32-32l0-160 160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-160 0 0-160z" />
  </svg>
)

export const Trash2 = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M136.7 5.9L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-8.7-26.1C306.9-7.2 294.7-16 280.9-16L167.1-16c-13.8 0-26 8.8-30.4 21.9zM416 144L32 144 53.1 467.1C54.7 492.4 75.7 512 101 512L347 512c25.3 0 46.3-19.6 47.9-44.9L416 144z" />
  </svg>
)

export const Upload = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M256 109.3L256 320c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-210.7-41.4 41.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l96-96c12.5-12.5 32.8-12.5 45.3 0l96 96c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 109.3zM224 400c44.2 0 80-35.8 80-80l80 0c35.3 0 64 28.7 64 64l0 32c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64l0-32c0-35.3 28.7-64 64-64l80 0c0 44.2 35.8 80 80 80zm144 24a24 24 0 1 0 0-48 24 24 0 1 0 0 48z" />
  </svg>
)

export const Search = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.1 253.9 416 208 416 93.1 416 0 322.9 0 208S93.1 0 208 0 416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
  </svg>
)

export const Filter = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M32 64C19.1 64 7.4 71.8 2.4 83.8S.2 109.5 9.4 118.6L192 301.3 192 416c0 8.5 3.4 16.6 9.4 22.6l64 64c9.2 9.2 22.9 11.9 34.9 6.9S320 492.9 320 480l0-178.7 182.6-182.6c9.2-9.2 11.9-22.9 6.9-34.9S492.9 64 480 64L32 64z" />
  </svg>
)

export const X = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192.5 301.3 329.9 438.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256 375.1 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7 55.1 73.4z" />
  </svg>
)

export const Edit2 = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M352.9 21.2L308 66.1 445.9 204 490.8 159.1C504.4 145.6 512 127.2 512 108s-7.6-37.6-21.2-51.1L455.1 21.2C441.6 7.6 423.2 0 404 0s-37.6 7.6-51.1 21.2zM274.1 100L58.9 315.1c-10.7 10.7-18.5 24.1-22.6 38.7L.9 481.6c-2.3 8.3 0 17.3 6.2 23.4s15.1 8.5 23.4 6.2l127.8-35.5c14.6-4.1 27.9-11.8 38.7-22.6L412 237.9 274.1 100z" />
  </svg>
)

export const Menu = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z" />
  </svg>
)

export const Swords = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M0 66.7L0 16C0 7.2 7.2 0 16 0L66.7 0c8.5 0 16.6 3.4 22.6 9.4l276.7 276.7-80 80-276.7-276.7C3.4 83.4 0 75.2 0 66.7zM400 448l-79.6 26.5c-10.1 3.4-21.1 .7-28.6-6.8-10.9-10.9-10.9-28.6 0-39.6L428.2 291.8c10.9-10.9 28.6-10.9 39.6 0 7.5 7.5 10.1 18.6 6.8 28.6L448 400 489.4 441.4c12.5 12.5 12.5 32.8 0 45.3l-2.7 2.7c-12.5 12.5-32.8 12.5-45.3 0L400 448zM112 320l30.1-30.1 80 80-30.1 30.1 28.2 28.2c10.9 10.9 10.9 28.6 0 39.6-7.5 7.5-18.6 10.1-28.6 6.8L112 448 70.6 489.4c-12.5 12.5-32.8 12.5-45.3 0l-2.7-2.7c-12.5-12.5-12.5-32.8 0-45.3L64 400 37.5 320.4c-3.4-10.1-.7-21.1 6.8-28.6 10.9-10.9 28.6-10.9 39.6 0L112 320zM502.6 89.4l-132.7 132.7-80-80 132.7-132.7c6-6 14.1-9.4 22.6-9.4L496 0c8.8 0 16 7.2 16 16l0 50.7c0 8.5-3.4 16.6-9.4 22.6z" />
  </svg>
)

export const UserPlus = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M136 128a120 120 0 1 1 240 0 120 120 0 1 1 -240 0zM48 482.3C48 383.8 127.8 304 226.3 304l59.4 0c98.5 0 178.3 79.8 178.3 178.3 0 16.4-13.3 29.7-29.7 29.7L77.7 512C61.3 512 48 498.7 48 482.3zM544 96c13.3 0 24 10.7 24 24l0 48 48 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-48 0 0 48c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-48-48 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0 0-48c0-13.3 10.7-24 24-24z" />
  </svg>
)

export const Home = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M277.8 8.6c-12.3-11.4-31.3-11.4-43.5 0l-224 208c-9.6 9-12.8 22.9-8 35.1S18.8 272 32 272l16 0 0 176c0 35.3 28.7 64 64 64l288 0c35.3 0 64-28.7 64-64l0-176 16 0c13.2 0 25-8.1 29.8-20.3s1.6-26.2-8-35.1l-224-208zM240 320l32 0c26.5 0 48 21.5 48 48l0 96-128 0 0-96c0-26.5 21.5-48 48-48z" />
  </svg>
)

export const CheckCircle2 = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zM374 145.7c-10.7-7.8-25.7-5.4-33.5 5.3L221.1 315.2 169 263.1c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l72 72c5 5 11.8 7.5 18.8 7s13.4-4.1 17.5-9.8L379.3 179.2c7.8-10.7 5.4-25.7-5.3-33.5z" />
  </svg>
)

export const Table = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M256 160l0 96 128 0 0-96-128 0zm-64 0l-128 0 0 96 128 0 0-96zM0 320L0 96C0 60.7 28.7 32 64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64l0-96zm384 0l-128 0 0 96 128 0 0-96zM192 416l0-96-128 0 0 96 128 0z" />
  </svg>
)

export const History = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M288 64c106 0 192 86 192 192S394 448 288 448c-65.2 0-122.9-32.5-157.6-82.3-10.1-14.5-30.1-18-44.6-7.9s-18 30.1-7.9 44.6C124.1 468.6 201 512 288 512 429.4 512 544 397.4 544 256S429.4 0 288 0C202.3 0 126.5 42.1 80 106.7L80 80c0-17.7-14.3-32-32-32S16 62.3 16 80l0 112c0 17.7 14.3 32 32 32l24.6 0c.5 0 1 0 1.5 0l86 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-38.3 0C154.9 102.6 217 64 288 64zm24 88c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 104c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65 0-94.1z" />
  </svg>
)

export const RefreshCw = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M65.9 228.5c13.3-93 93.4-164.5 190.1-164.5 53 0 101 21.5 135.8 56.2 .2 .2 .4 .4 .6 .6l7.6 7.2-47.9 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l128 0c17.7 0 32-14.3 32-32l0-128c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 53.4-11.3-10.7C390.5 28.6 326.5 0 256 0 127 0 20.3 95.4 2.6 219.5 .1 237 12.2 253.2 29.7 255.7s33.7-9.7 36.2-27.1zm443.5 64c2.5-17.5-9.7-33.7-27.1-36.2s-33.7 9.7-36.2 27.1c-13.3 93-93.4 164.5-190.1 164.5-53 0-101-21.5-135.8-56.2-.2-.2-.4-.4-.6-.6l-7.6-7.2 47.9 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L32 320c-8.5 0-16.7 3.4-22.7 9.5S-.1 343.7 0 352.3l1 127c.1 17.7 14.6 31.9 32.3 31.7S65.2 496.4 65 478.7l-.4-51.5 10.7 10.1c46.3 46.1 110.2 74.7 180.7 74.7 129 0 235.7-95.4 253.4-219.5z" />
  </svg>
)

export const ArrowLeftRight = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M502.6 150.6l-96 96c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L402.7 160 32 160c-17.7 0-32-14.3-32-32S14.3 96 32 96l370.7 0-41.4-41.4c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l96 96c12.5 12.5 12.5 32.8 0 45.3zm-397.3 352l-96-96c-12.5-12.5-12.5-32.8 0-45.3l96-96c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3L109.3 352 480 352c17.7 0 32 14.3 32 32s-14.3 32-32 32l-370.7 0 41.4 41.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0z" />
  </svg>
)

export const Award = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M245.9-25.9c-13.4-8.2-30.3-8.2-43.7 0-24.4 14.9-39.5 18.9-68.1 18.3-15.7-.4-30.3 8.1-37.9 21.9-13.7 25.1-24.8 36.2-49.9 49.9-13.8 7.5-22.2 22.2-21.9 37.9 .7 28.6-3.4 43.7-18.3 68.1-8.2 13.4-8.2 30.3 0 43.7 14.9 24.4 18.9 39.5 18.3 68.1-.4 15.7 8.1 30.3 21.9 37.9 22.1 12.1 33.3 22.1 45.1 41.5L42.7 458.5c-5.9 11.9-1.1 26.3 10.7 32.2l86 43c11.5 5.7 25.5 1.4 31.7-9.8l52.8-95.1 52.8 95.1c6.2 11.2 20.2 15.6 31.7 9.8l86-43c11.9-5.9 16.7-20.3 10.7-32.2l-48.6-97.2c11.7-19.4 23-29.4 45.1-41.5 13.8-7.5 22.2-22.2 21.9-37.9-.7-28.6 3.4-43.7 18.3-68.1 8.2-13.4 8.2-30.3 0-43.7-14.9-24.4-18.9-39.5-18.3-68.1 .4-15.7-8.1-30.3-21.9-37.9-25.1-13.7-36.2-24.8-49.9-49.9-7.5-13.8-22.2-22.2-37.9-21.9-28.6 .7-43.7-3.4-68.1-18.3zM224 96a96 96 0 1 1 0 192 96 96 0 1 1 0-192z" />
  </svg>
)

export const ChevronLeft = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z" />
  </svg>
)

export const ChevronRight = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M311.1 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L243.2 256 73.9 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z" />
  </svg>
)

export const Undo2 = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M24 192l144 0c9.7 0 18.5-5.8 22.2-14.8s1.7-19.3-5.2-26.2l-46.7-46.7c75.3-58.6 184.3-53.3 253.5 15.9 75 75 75 196.5 0 271.5s-196.5 75-271.5 0c-10.2-10.2-19-21.3-26.4-33-9.5-14.9-29.3-19.3-44.2-9.8s-19.3 29.3-9.8 44.2C49.7 408.7 61.4 423.5 75 437 175 537 337 537 437 437S537 175 437 75C342.8-19.3 193.3-24.7 92.7 58.8L41 7C34.1 .2 23.8-1.9 14.8 1.8S0 14.3 0 24L0 168c0 13.3 10.7 24 24 24z" />
  </svg>
)

export const ChevronDown = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M201.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 338.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
  </svg>
)

export const ChevronUp = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M201.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L224 173.3 54.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z" />
  </svg>
)

export const Heart = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M241 87.1l15 20.7 15-20.7C296 52.5 336.2 32 378.9 32 452.4 32 512 91.6 512 165.1l0 2.6c0 112.2-139.9 242.5-212.9 298.2-12.4 9.4-27.6 14.1-43.1 14.1s-30.8-4.6-43.1-14.1C139.9 410.2 0 279.9 0 167.7l0-2.6C0 91.6 59.6 32 133.1 32 175.8 32 216 52.5 241 87.1z" />
  </svg>
)

export const Clock = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M256 0a256 256 0 1 1 0 512 256 256 0 1 1 0-512zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
  </svg>
)

export const Eye = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z" />
  </svg>
)

export const Shield = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M256 0c4.6 0 9.2 1 13.4 2.9L457.8 82.8c22 9.3 38.4 31 38.3 57.2-.5 99.2-41.3 280.7-213.6 363.2-16.7 8-36.1 8-52.8 0-172.4-82.5-213.1-264-213.6-363.2-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.9 1 251.4 0 256 0z" />
  </svg>
)

export const Lock = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className={className} fill="currentColor" {...props}>
    <path fill="currentColor" d="M128 96l0 64 128 0 0-64c0-35.3-28.7-64-64-64s-64 28.7-64 64zM64 160l0-64C64 25.3 121.3-32 192-32S320 25.3 320 96l0 64c35.3 0 64 28.7 64 64l0 224c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 224c0-35.3 28.7-64 64-64z" />
  </svg>
)
// Portal Icons (Duotone)

export const SpectatorIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 616 560" className={className} {...props}>
    <path opacity=".4" fill="currentColor" d="M252 279c32-4.6 59-24.6 73.2-52.3 22.5 7.3 38.8 28.4 38.8 53.3 0 30.9-25.1 56-56 56-30.9 0-56.5-26.1-56-57z"/>
    <path fill="currentColor" d="M308 168c-14.6 0-26.1 10.3-29 23.3-4.2 18.7-21 32.7-41 32.7-14 0-33.6 8.1-38.8 29.5-2.1 8.5-3.2 17.4-3.2 26.5 0 61.9 50.1 112 112 112s112-50.1 112-112-50.1-112-112-112zM252 279c32-4.6 59-24.6 73.2-52.3 22.5 7.3 38.8 28.4 38.8 53.3 0 30.9-25.1 56-56 56-30.9 0-56.5-26.1-56-57zM308 42C138.8 42 46.6 165.5 15.9 216 4.2 235.2 0 256.6 0 276.6l0 6.8c0 20 4.2 41.4 15.9 60.6 30.7 50.5 122.9 174 292.1 174S569.4 394.5 600.1 344c11.7-19.2 15.9-40.6 15.9-60.6l0-6.8c0-20-4.2-41.4-15.9-60.6-30.7-50.5-122.9-174-292.1-174zM63.8 245.1C91.6 199.2 169.2 98 308 98S524.4 199.2 552.2 245.1c5.1 8.5 7.8 19.1 7.8 31.5l0 6.8c0 12.4-2.6 23.1-7.8 31.5-27.9 45.8-105.4 147.1-244.2 147.1S91.6 360.8 63.8 314.9c-5.1-8.5-7.8-19.1-7.8-31.5l0-6.8c0-12.4 2.6-23.1 7.8-31.5z"/>
  </svg>
)

export const CourtkeeperIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={className} {...props}>
    <path opacity=".4" fill="currentColor" d="M64 32L448 192 64 352 64 32z"/>
    <path fill="currentColor" d="M64 0L64 512 0 512 0 0 64 0z"/>
  </svg>
)

export const VolunteerIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} {...props}>
    <path opacity=".4" fill="currentColor" d="M0 288l0 32c0 23.7 12.9 44.4 32 55.4L32 432c0 26.5 21.5 48 48 48l32 0c12.3 0 23.6-4.6 32.1-12.3 0-1.2-.1-2.5-.1-3.7l0-75.3c-19.9-22.5-32-52.2-32-84.7l0-32c0-26.7 7.3-51.6 19.9-73.1-11.1-4.5-23.2-6.9-35.9-6.9-53 0-96 43-96 96zM40 88A56 56 0 1 0 152 88 56 56 0 1 0 40 88zm320 0a56 56 0 1 0 112 0 56 56 0 1 0 -112 0zm8 300.7l0 75.3c0 1.2 0 2.5-.1 3.7 8.5 7.6 19.7 12.3 32.1 12.3l32 0c26.5 0 48-21.5 48-48l0-56.6c19.1-11.1 32-31.7 32-55.4l0-32c0-53-43-96-96-96-12.7 0-24.8 2.5-35.9 6.9 12.6 21.4 19.9 46.4 19.9 73.1l0 32c0 32.5-12.1 62.1-32 84.7z"/>
    <path fill="currentColor" d="M320 64a64 64 0 1 0 -128 0 64 64 0 1 0 128 0zm0 307.9C339.3 359 352 337 352 312l0-40c0-53-43-96-96-96s-96 43-96 96l0 40c0 25 12.7 47 32 59.9l0 92.1c0 26.5 21.5 48 48 48l32 0c26.5 0 48-21.5 48-48l0-92.1z"/>
  </svg>
)

export const AdminIcon = ({ className, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className} {...props}>
    <path opacity=".4" fill="currentColor" d="M0 304L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-112-136 0 0 40c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-40-144 0 0 40c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-40-136 0z"/>
    <path fill="currentColor" d="M176 56l0 40 160 0 0-40c0-4.4-3.6-8-8-8L184 48c-4.4 0-8 3.6-8 8zM128 96l0-40c0-30.9 25.1-56 56-56L328 0c30.9 0 56 25.1 56 56l0 40 28.1 0c12.7 0 24.9 5.1 33.9 14.1l51.9 51.9c9 9 14.1 21.2 14.1 33.9l0 108.1-136 0 0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40-144 0 0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40-136 0 0-108.1c0-12.7 5.1-24.9 14.1-33.9l51.9-51.9c9-9 21.2-14.1 33.9-14.1L128 96z"/>
  </svg>
)
