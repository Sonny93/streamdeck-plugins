import { splitWireString } from './split_wire_string';

/**
 * Responses modelled on a real unit (type=aircon, firmware 4.2.303). MAC, id, name and SSIDs are invented.
 * Notable observed traits: no `dt6`/`dh6`, `dt2=M`, `dh1=AUTO`, `hhum=-`.
 */
export const FAKE_UNIT_DEFAULTS = {
	basicInfo: splitWireString(
		'type=aircon,reg=eu,dst=1,ver=4_2_303,rev=30610C5A,pow=0,err=0,location=0,name=%54%65%73%74,icon=0,instform=0,method=polling,port=30050,id=00000000-0000-0000-0000-000000000000,pw=,lpw_flag=0,adp_kind=3,pv=3.2,cpv=3,cpv_minor=20,led=1,en_setzone=1,mac=00005E005301,ssid=DaikinAP00000,adp_mode=run,en_hol=0,radio1=-69,grp_name=,en_grp=0,ssid1=lan,sec_type=WPA2'
	),
	modelInfo: splitWireString(
		'model=10F6,type=N,pv=3.2,cpv=3,cpv_minor=20,mid=NA,humd=0,s_humd=0,acled=0,land=0,elec=1,temp=1,temp_rng=0,m_dtct=1,ac_dst=--,disp_dry=0,dmnd=1,en_scdltmr=1,en_frate=1,en_rtemp_a=0,en_spmode=7,en_ipw_sep=1,en_mompow=1,en_patrol=0,en_filter_sign=0,shtyp=0,en_cjlink=1,en_onofftmr=1,hmlmt_l=10.0,en_fdir=1,s_fdir=3'
	),
	sensorInfo: splitWireString(
		'htemp=23.0,hhum=-,otemp=4.0,err=0,cmpfreq=0,mompow=1'
	),
	weekPowerEx: splitWireString(
		's_dayw=1,week_heat=0/0/1/0/5/11/14/22/3/0/0/0/0/0,week_cool=0/0/0/0/3/2/1/1/1/0/1/0/1/1'
	),
	controlInfo: splitWireString(
		'pow=0,mode=3,adv=,stemp=21.0,shum=0,dt1=25.0,dt2=M,dt3=21.0,dt4=25.0,dt5=25.0,dt7=25.0,dh1=AUTO,dh2=50,dh3=0,dh4=0,dh5=0,dh7=AUTO,dhh=50,b_mode=3,b_stemp=21.0,b_shum=0,alert=255,f_rate=A,b_f_rate=A,dfr1=A,dfr2=A,dfr3=A,dfr4=A,dfr5=A,dfr6=A,dfr7=A,dfrh=A,f_dir=0,b_f_dir=0,dfd1=0,dfd2=0,dfd3=0,dfd4=0,dfd5=0,dfd6=0,dfd7=0,dfdh=0,dmnd_run=0,en_demand=0'
	),
} as const;
