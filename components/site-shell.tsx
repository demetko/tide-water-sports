"use client";
import {Waves,Globe2,ArrowUpRight} from 'lucide-react';
import {usePathname} from 'next/navigation';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {useI18n,languages,Lang} from '@/lib/i18n';
export function Header(){const {lang,setLang,t}=useI18n();const path=usePathname();return <header className="site-header"><a className="brand" href="/" aria-label="Tide"><Waves/>tide<span>WATER SPORTS</span></a><nav><a className={path==='/'?'active':''} href="/">{t('book')}</a><a className={path==='/vendor'?'active':''} href="/vendor">{t('vendor')} <ArrowUpRight size={14}/></a></nav><div className="language"><Globe2 size={17}/><Select value={lang} onValueChange={l=>setLang(l as Lang)}><SelectTrigger aria-label="Language / Език" className="language-select"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(languages).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div></header>}
export function Footer(){const {t}=useI18n();return <footer><a className="brand" href="/" aria-label="Tide"><Waves/>tide</a><span>{t('made')}</span><div><a href="/compliance/terms">{t('terms')}</a><a href="/compliance/privacy">{t('privacy')}</a><small>© 2026 Tide</small></div></footer>}
