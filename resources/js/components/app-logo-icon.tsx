import type { ImgHTMLAttributes } from 'react';

export const appLogoIconUrl = '/agrinas-logo-icon.png';

type AppLogoIconProps = Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'alt' | 'src'
> & {
    alt?: string;
};

export default function AppLogoIcon({
    alt = 'Agrinas Pangan Nusantara',
    ...props
}: AppLogoIconProps) {
    return (
        <img
            {...props}
            src={appLogoIconUrl}
            alt={alt}
            decoding="async"
            loading="eager"
        />
    );
}
