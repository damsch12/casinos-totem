import { fetchParticipantByDocumentNumber } from '@/app/lib/data/participants';
import { fetchPremiseById } from '@/app/lib/data/premises';
import { fetchActivePromotion } from '@/app/lib/data/promotions';
import { ApiResponse, Participant, Premise, Promotion, TokenPremise } from '@/app/lib/definitions';
import { LogOut } from '@/app/ui/components/logOut';
import { PromotionParticipationForm } from '@/app/ui/components/promotion/promotion-participation-form';
import { auth } from '@/auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registro',
};
 
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  let id = (await params).id
  let premise : Premise | undefined = undefined;
  let tokenPremise: TokenPremise | undefined = undefined;
  let promotion: Promotion | undefined = undefined;
  let participant: Participant | undefined = undefined;
  let apiStatus: number = 200;
  const session = await auth();
  
  // If user is not logged in session will be null
  // If the user has many premises, only the first one will be used.
  // Totem users should have only 1 premise
  if(session && session.user_data){
    tokenPremise = session.user_data?.premises[0];
    
    let promotionResp: ApiResponse = await fetchActivePromotion(tokenPremise.id);

    apiStatus = promotionResp.status;
    if(apiStatus !== 401){
      promotion = promotionResp.data;

      let premisesResp: ApiResponse = await fetchPremiseById(tokenPremise.id);

      apiStatus = premisesResp.status;
      if(apiStatus != 401){
        premise = premisesResp.data;

        let participantResponse : ApiResponse = await fetchParticipantByDocumentNumber(id);
        apiStatus = participantResponse.status;
        if(apiStatus!= 401){
          participant = participantResponse.data;
        }
      }
    }


  } else {
    //TODO ver como manejar cuando no hay session
  }

  return (
    <main>
      <LogOut status={apiStatus}/>
      <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${promotion?.background.path}')` }} >
        <PromotionParticipationForm doc_number={id} promotion={promotion} premise={premise} participant={participant}/>
      </div>
    </main>
  );
}