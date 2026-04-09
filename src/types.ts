interface Debug {
    link: string;
    type: 'img' | 'vid';
}

interface Page {
    disp: 'Back' | 'Dashboard';
    link: '/' | '/dashboard';
}

export type { Debug, Page };